import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

/**
 * Cloud Function que se activa cuando se crea un nuevo documento en la colección 'massNotifications'
 * con status 'pending'. Envía la notificación a todos los usuarios registrados.
 */
export const processMassNotifications = functions.firestore
  .document('massNotifications/{notificationId}')
  .onCreate(async (snapshot: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
     console.log('🔔 Función de notificación triggered');
    console.log('Datos de notificación:', snapshot.data());
    try {
      const notificationData = snapshot.data();
      const notificationId = context.params.notificationId;
      
      // Verificar que la notificación esté pendiente
      if (notificationData.status !== 'pending') {
        console.log(`Notificación masiva ${notificationId} no está pendiente, estado: ${notificationData.status}`);
        return null;
      }
      
      console.log(`Procesando notificación masiva ${notificationId}`);
      
      // Preparar el mensaje de notificación
      const message = {
        notification: {
          title: notificationData.title || 'Notificación importante',
          body: notificationData.message,
        },
        data: {
          notificationId,
          type: 'mass',
          createdAt: notificationData.createdAt?.toDate().toISOString() || new Date().toISOString(),
        },
      };
      
      // Agregar imagen si existe
      if (notificationData.imageUrl) {
        (message.notification as any).imageUrl = notificationData.imageUrl;
      }
      
      // Obtener todos los usuarios
      const usersSnapshot = await admin.firestore().collection('users').get();
      
      if (usersSnapshot.empty) {
        console.log('No se encontraron usuarios para enviar notificación masiva');
        await updateMassNotificationStatus(notificationId, 'failed', 'No se encontraron usuarios');
        return null;
      }
      
      let totalDevices = 0;
      let successCount = 0;
      let failureCount = 0;
      
      // Procesar cada usuario
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        
        // Obtener tokens FCM del usuario
        const fcmTokensSnapshot = await admin.firestore()
          .collection('users')
          .doc(userId)
          .collection('fcmTokens')
          .get();
        
        if (fcmTokensSnapshot.empty) {
          console.log(`Usuario ${userId} no tiene tokens FCM registrados`);
          continue;
        }
        
        // Enviar notificación a cada dispositivo del usuario
        for (const tokenDoc of fcmTokensSnapshot.docs) {
          const tokenData = tokenDoc.data();
          if (!tokenData.token) continue;
          
          totalDevices++;
          
          try {
            
            await admin.messaging().send({
              ...message,
              token: tokenData.token,
            });
            successCount++;
          } catch (error: any) {
            failureCount++;
            console.error(`Error al enviar notificación masiva a usuario ${userId}, token ${tokenDoc.id}:`, error);
            
            // Si el error es por token inválido, eliminarlo
            if (error.code === 'messaging/invalid-registration-token' || 
                error.code === 'messaging/registration-token-not-registered') {
              try {
                await admin.firestore()
                  .collection('users')
                  .doc(userId)
                  .collection('fcmTokens')
                  .doc(tokenDoc.id)
                  .delete();
                console.log(`Token inválido eliminado: ${tokenDoc.id} de usuario ${userId}`);
              } catch (deleteError: any) {
                console.error(`Error al eliminar token inválido:`, deleteError);
              }
            }
          }
        }
      }
      
      // Actualizar estado de la notificación masiva
      const status = successCount > 0 ? 'sent' : 'failed';
      const statusMessage = `Enviado a ${successCount} de ${totalDevices} dispositivos. Fallos: ${failureCount}`;
      
      console.log(`Notificación masiva ${notificationId} procesada: ${statusMessage}`);
      await updateMassNotificationStatus(notificationId, status, statusMessage);
      
      return null;
    } catch (error: any) {
      console.error('Error procesando notificación masiva:', error);
      // Intentar actualizar el estado de la notificación
      if (context && context.params && context.params.notificationId) {
        const notificationId = context.params.notificationId;
        try {
          await updateMassNotificationStatus(notificationId, 'failed', error.message || 'Error desconocido');
        } catch (updateError) {
          console.error('Error al actualizar estado de notificación fallida:', updateError);
        }
      }
      return null;
    }
  });

/**
 * Actualiza el estado de una notificación masiva en Firestore
 */
async function updateMassNotificationStatus(
  notificationId: string,
  status: 'sent' | 'failed',
  statusMessage: string
) {
  await admin.firestore()
    .collection('massNotifications')
    .doc(notificationId)
    .update({
      status,
      statusMessage,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}