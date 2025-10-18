import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Importar funciones de notificaciones masivas
import { processMassNotifications } from './massNotifications';

// Inicializar la aplicación de Firebase Admin
admin.initializeApp();

// Exportar todas las funciones
export { processMassNotifications };

/**
 * Cloud Function que se activa cuando se crea un nuevo documento en la colección 'notifications'
 * con status 'pending'. Envía la notificación a través de FCM y actualiza el estado a 'sent'.
 */
export const processNotifications = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    try {
      const notificationData = snapshot.data();
      const notificationId = context.params.notificationId;
      
      // Verificar que la notificación esté pendiente
      if (notificationData.status !== 'pending') {
        console.log(`Notificación ${notificationId} no está pendiente, estado: ${notificationData.status}`);
        return null;
      }
      
      console.log(`Procesando notificación ${notificationId}`);
      
      // Obtener el ID del cliente
      const clientId = notificationData.clientId;
      if (!clientId) {
        console.error(`Notificación ${notificationId} no tiene clientId`);
        await updateNotificationStatus(notificationId, 'failed', 'No se especificó clientId');
        return null;
      }
      
      // Obtener los tokens FCM del cliente
      const fcmTokensSnapshot = await admin.firestore()
        .collection('users')
        .doc(clientId)
        .collection('fcmTokens')
        .get();
      
      if (fcmTokensSnapshot.empty) {
        console.log(`No se encontraron tokens FCM para el cliente ${clientId}`);
        await updateNotificationStatus(notificationId, 'failed', 'No se encontraron tokens FCM');
        return null;
      }
      
      // Preparar el mensaje de notificación
      const message = {
        notification: {
          title: notificationData.title || 'Nueva notificación',
          body: notificationData.message,
        },
        data: {
          notificationId,
          type: notificationData.type || 'admin_message',
          createdAt: notificationData.createdAt?.toDate().toISOString() || new Date().toISOString(),
        },
      };
      
      // Agregar imagen si existe
      if (notificationData.imageUrl) {
        (message.notification as any).imageUrl = notificationData.imageUrl;
      }
      
      // Enviar la notificación a todos los dispositivos del cliente
      let successCount = 0;
      let failureCount = 0;
      const invalidTokens: string[] = [];
      
      for (const tokenDoc of fcmTokensSnapshot.docs) {
        const tokenData = tokenDoc.data();
        if (!tokenData.token) continue;
        
        try {
          await admin.messaging().send({
            ...message,
            token: tokenData.token,
          });
          successCount++;
          console.log(`Notificación enviada exitosamente a token ${tokenData.token}`);
        } catch (error: any) {
          failureCount++;
          console.error(`Error al enviar notificación a token ${tokenData.token}:`, error);
          
          // Si el error es por token inválido, marcarlo para eliminación
          if (error.code === 'messaging/invalid-registration-token' || 
              error.code === 'messaging/registration-token-not-registered') {
            invalidTokens.push(tokenDoc.id);
          }
        }
      }
      
      // Eliminar tokens inválidos
      if (invalidTokens.length > 0) {
        console.log(`Eliminando ${invalidTokens.length} tokens inválidos`);
        const batch = admin.firestore().batch();
        
        for (const tokenId of invalidTokens) {
          const tokenRef = admin.firestore()
            .collection('users')
            .doc(clientId)
            .collection('fcmTokens')
            .doc(tokenId);
          
          batch.delete(tokenRef);
        }
        
        await batch.commit();
        console.log(`${invalidTokens.length} tokens inválidos eliminados`);
      }
      
      if (successCount === 0) {
        console.error(`No se pudo enviar la notificación a ningún dispositivo del cliente ${clientId}`);
        await updateNotificationStatus(notificationId, 'failed', `Falló en todos los ${failureCount} dispositivos`);
        return null;
      }
      
      console.log(`Notificación ${notificationId} enviada exitosamente a ${successCount} dispositivos, fallos: ${failureCount}`);
      await updateNotificationStatus(notificationId, 'sent', `Enviado a ${successCount} dispositivos, ${failureCount} fallos`);
      
      return null;
    } catch (error: any) {
      console.error('Error procesando notificación:', error);
      // Intentar actualizar el estado de la notificación si tenemos el ID
      if (context && context.params && context.params.notificationId) {
        const notificationId = context.params.notificationId;
        try {
          await updateNotificationStatus(notificationId, 'failed', error.message || 'Error desconocido');
        } catch (updateError) {
          console.error('Error al actualizar estado de notificación fallida:', updateError);
        }
      }
      return null;
    }
  });

/**
 * NUEVA: Función programada que verifica turnos próximos y envía recordatorios
 * Se ejecuta cada hora para buscar turnos que sean en 3 horas
 */
export const checkUpcomingAppointments = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('America/Argentina/Buenos_Aires')
  .onRun(async (context) => {
    const now = new Date();
    console.log('⏰ Verificando turnos próximos a las:', now.toISOString());

    try {
      // Obtener todos los turnos pendientes o confirmados
      const appointmentsSnapshot = await admin.firestore()
        .collection('appointments')
        .where('status', 'in', ['pending', 'confirmed'])
        .get();

      if (appointmentsSnapshot.empty) {
        console.log('No hay turnos para verificar');
        return null;
      }

      const promises: Promise<any>[] = [];

      appointmentsSnapshot.forEach((doc) => {
        const appointment = doc.data();
        const appointmentId = doc.id;

        // Combinar fecha y hora del turno
        try {
          const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
          
          // Calcular la diferencia en horas
          const timeDiff = appointmentDateTime.getTime() - now.getTime();
          const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);

          // Si el turno es en aproximadamente 3 horas (entre 2.5 y 3.5 horas)
          if (hoursUntilAppointment >= 2.5 && hoursUntilAppointment <= 3.5) {
            console.log(`✅ Turno ${appointmentId} encontrado en 3 horas`);
            
            // Verificar si ya se envió la notificación
            if (!appointment.notificationSent3Hours) {
              promises.push(sendAppointmentReminder(appointment, appointmentId));
            } else {
              console.log(`⏭️  Notificación ya enviada para turno ${appointmentId}`);
            }
          }
        } catch (error) {
          console.error(`Error procesando fecha del turno ${appointmentId}:`, error);
        }
      });

      await Promise.all(promises);
      console.log(`✅ Procesados ${promises.length} turnos con recordatorios`);

      return null;
    } catch (error) {
      console.error('❌ Error verificando turnos:', error);
      return null;
    }
  });

/**
 * NUEVA: Función para enviar recordatorio de turno 3 horas antes
 */
async function sendAppointmentReminder(appointment: any, appointmentId: string) {
  try {
    const userId = appointment.userId;
    
    if (!userId) {
      console.log(`⚠️  Turno ${appointmentId} no tiene userId`);
      return;
    }

    // Obtener los tokens FCM del usuario
    const tokensSnapshot = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .get();

    if (tokensSnapshot.empty) {
      console.log(`⚠️  No hay tokens FCM para usuario ${userId}`);
      return;
    }

    // Preparar datos del turno
    const treatments = appointment.treatments || [];
    const treatmentsList = treatments.map((t: any) => t.name).join(', ');
    const total = treatments.reduce((sum: number, t: any) => sum + (t.price || 0), 0);
    const clientName = `${appointment.personalData?.name || ''} ${appointment.personalData?.lastname || ''}`.trim();

    // Crear el mensaje de notificación
    const message = {
      notification: {
        title: '⏰ ¡Recordatorio de Turno!',
        body: `Hola ${appointment.personalData?.name || 'cliente'}, tu turno es en 3 horas a las ${appointment.time}hs`,
      },
      data: {
        appointmentId: appointmentId,
        type: 'appointment_reminder',
        date: appointment.date,
        time: appointment.time,
        treatments: treatmentsList,
        total: total.toString(),
        clientName: clientName,
      },
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'appointment_reminders',
          priority: 'high' as const,
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    // Enviar notificación a todos los tokens del usuario
    let successCount = 0;
    let failureCount = 0;
    
    const sendPromises = tokensSnapshot.docs.map(async (tokenDoc) => {
      const tokenData = tokenDoc.data();
      const token = tokenData.token;

      try {
        await admin.messaging().send({
          ...message,
          token: token,
        });
        successCount++;
        console.log(`✅ Notificación enviada a token: ${token.substring(0, 20)}...`);
      } catch (error: any) {
        failureCount++;
        console.error(`❌ Error enviando a token ${token.substring(0, 20)}...:`, error.code);
        
        // Si el token es inválido, eliminarlo
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
          await tokenDoc.ref.delete();
          console.log(`🗑️  Token inválido eliminado: ${token.substring(0, 20)}...`);
        }
      }
    });

    await Promise.all(sendPromises);

    if (successCount > 0) {
      // Marcar que se envió la notificación
      await admin.firestore().collection('appointments').doc(appointmentId).update({
        notificationSent3Hours: true,
        notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Recordatorio enviado para turno ${appointmentId} (${successCount} dispositivos)`);
    } else {
      console.log(`❌ No se pudo enviar recordatorio para turno ${appointmentId}`);
    }
  } catch (error) {
    console.error(`❌ Error enviando recordatorio para turno ${appointmentId}:`, error);
  }
}

/**
 * NUEVA: Función que se dispara cuando se crea un turno
 * Envía notificación de confirmación inmediata
 */
export const onAppointmentCreated = functions.firestore
  .document('appointments/{appointmentId}')
  .onCreate(async (snap, context) => {
    const appointment = snap.data();
    const appointmentId = context.params.appointmentId;

    console.log(`📅 Nuevo turno creado: ${appointmentId}`);

    const userId = appointment.userId;
    
    if (!userId) {
      console.log('⚠️  Turno sin userId, no se envía confirmación');
      return;
    }

    try {
      const tokensSnapshot = await admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('fcmTokens')
        .get();

      if (tokensSnapshot.empty) {
        console.log(`⚠️  No hay tokens FCM para usuario ${userId}`);
        return;
      }

      const treatments = appointment.treatments || [];
      const treatmentsList = treatments.map((t: any) => t.name).join(', ');

      const message = {
        notification: {
          title: '✅ Turno Confirmado',
          body: `Tu turno fue agendado para el ${appointment.date} a las ${appointment.time}hs`,
        },
        data: {
          appointmentId: appointmentId,
          type: 'appointment_confirmed',
          date: appointment.date,
          time: appointment.time,
          treatments: treatmentsList,
        },
      };

      const sendPromises = tokensSnapshot.docs.map((tokenDoc) => {
        const token = tokenDoc.data().token;
        return admin.messaging().send({
          ...message,
          token: token,
        }).catch((error) => {
          console.error('❌ Error enviando confirmación:', error);
        });
      });

      await Promise.all(sendPromises);
      console.log(`✅ Confirmación enviada para turno ${appointmentId}`);
    } catch (error) {
      console.error('❌ Error en confirmación de turno:', error);
    }
  });

/**
 * NUEVA: Función que se dispara cuando se cancela un turno
 * Envía notificación de cancelación al cliente
 */
export const onAppointmentCancelled = functions.firestore
  .document('appointments/{appointmentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const appointmentId = context.params.appointmentId;

    // Verificar si el estado cambió a cancelado
    if (before.status !== 'cancelled' && after.status === 'cancelled') {
      console.log(`❌ Turno cancelado: ${appointmentId}`);
      
      const userId = after.userId;
      
      if (!userId) {
        console.log('⚠️  Turno sin userId, no se envía cancelación');
        return;
      }

      try {
        const tokensSnapshot = await admin.firestore()
          .collection('users')
          .doc(userId)
          .collection('fcmTokens')
          .get();

        if (tokensSnapshot.empty) {
          console.log(`⚠️  No hay tokens FCM para usuario ${userId}`);
          return;
        }

        const message = {
          notification: {
            title: '❌ Turno Cancelado',
            body: `Tu turno del ${after.date} a las ${after.time}hs ha sido cancelado`,
          },
          data: {
            appointmentId: appointmentId,
            type: 'appointment_cancelled',
            date: after.date,
            time: after.time,
          },
        };

        const sendPromises = tokensSnapshot.docs.map((tokenDoc) => {
          const token = tokenDoc.data().token;
          return admin.messaging().send({
            ...message,
            token: token,
          }).catch((error) => {
            console.error('❌ Error enviando cancelación:', error);
          });
        });

        await Promise.all(sendPromises);
        console.log(`✅ Cancelación enviada para turno ${appointmentId}`);
      } catch (error) {
        console.error('❌ Error en notificación de cancelación:', error);
      }
    }
  });

/**
 * Actualiza el estado de una notificación en Firestore
 */
async function updateNotificationStatus(
  notificationId: string,
  status: 'sent' | 'failed',
  errorMessage?: string
) {
  const updateData: Record<string, any> = {
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }
  
  await admin.firestore()
    .collection('notifications')
    .doc(notificationId)
    .update(updateData);
}