# Sistema de Notificaciones Push

## Arquitectura Implementada

Se ha implementado un sistema completo de notificaciones push utilizando Firebase Cloud Messaging (FCM) con los siguientes componentes:

### 1. Almacenamiento de Tokens FCM

- Cuando un usuario inicia sesión, se solicita permiso para notificaciones.
- Si se concede, se obtiene el token FCM y se almacena en Firestore en la ruta `users/{userId}/fcmTokens/{tokenId}`.
- Cada token se guarda con información del dispositivo y una marca de tiempo.

### 2. Envío de Notificaciones

#### Notificaciones Individuales
- Se guardan en la colección `notifications` con estado `pending`.
- Incluyen `clientId`, `message`, y opcionalmente `imageUrl`.
- Las imágenes se almacenan en Firebase Storage en la ruta `users/{userId}/notifications/`.

#### Notificaciones Masivas
- Se guardan en la colección `massNotifications` con estado `pending`.
- Incluyen `title`, `message`, y opcionalmente `imageUrl`.

### 3. Cloud Functions

Se han implementado dos Cloud Functions para procesar las notificaciones:

#### `processNotifications`
- Se activa cuando se crea un nuevo documento en la colección `notifications`.
- Busca los tokens FCM del cliente en `users/{clientId}/fcmTokens`.
- Envía la notificación a todos los dispositivos del cliente usando Firebase Cloud Messaging.
- Actualiza el estado de la notificación a `sent` o `failed`.

#### `processMassNotifications`
- Se activa cuando se crea un nuevo documento en la colección `massNotifications`.
- Busca todos los usuarios y sus tokens FCM.
- Envía la notificación a todos los dispositivos de todos los usuarios.
- Actualiza el estado de la notificación a `sent` o `failed`.

## Flujo de Notificaciones

1. **Cliente (React/Web/App)**
   - Obtiene FCM token con `getToken(...)`.
   - Guarda ese token en Firestore junto al usuario.

2. **Envío de Notificación**
   - Se crea un documento en la colección `notifications` o `massNotifications`.
   - El estado inicial es `pending`.

3. **Cloud Function**
   - Se activa automáticamente cuando se crea una nueva notificación.
   - Envía la notificación usando `admin.messaging().send()`.
   - Actualiza el estado a `sent` o `failed`.

## Implementación

### Estructura de Archivos

- `functions/src/index.ts`: Cloud Function para procesar notificaciones individuales.
- `functions/src/massNotifications.ts`: Cloud Function para procesar notificaciones masivas.
- `src/components/AppointmentSystem.tsx`: Implementación del cliente para enviar notificaciones.
- `src/examples/MassNotificationExample.tsx`: Ejemplo de cómo enviar notificaciones masivas.

### Despliegue

Para desplegar las Cloud Functions:

```bash
cd functions
npm install
npm run deploy
```

## Notas Importantes

- Las notificaciones se procesan de forma asíncrona mediante Cloud Functions.
- Las imágenes se almacenan en Firebase Storage en la carpeta del usuario que las sube.
- Los tokens FCM inválidos se eliminan automáticamente cuando se detectan.
- Las notificaciones masivas pueden tardar más tiempo en procesarse si hay muchos usuarios.