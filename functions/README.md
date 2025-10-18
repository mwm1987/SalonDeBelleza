# Cloud Functions para Notificaciones Push

Este directorio contiene las Cloud Functions necesarias para procesar notificaciones push en la aplicación.

## Estructura

- `src/index.ts`: Contiene la función principal `processNotifications` que se activa cuando se crea una nueva notificación en Firestore.

## Flujo de Notificaciones

1. **Almacenamiento de Tokens FCM**:
   - Cuando un usuario inicia sesión, se solicita permiso para notificaciones.
   - Si se concede, se obtiene el token FCM y se almacena en `users/{userId}/fcmTokens/{tokenId}`.

2. **Creación de Notificaciones**:
   - Las notificaciones se crean en la colección `notifications` con estado `pending`.
   - Cada notificación incluye `clientId`, `message`, y opcionalmente `imageUrl`.

3. **Procesamiento de Notificaciones**:
   - La Cloud Function `processNotifications` se activa cuando se crea un nuevo documento en `notifications`.
   - Busca los tokens FCM del cliente en `users/{clientId}/fcmTokens`.
   - Envía la notificación a todos los dispositivos del cliente usando Firebase Cloud Messaging.
   - Actualiza el estado de la notificación a `sent` o `failed`.

## Implementación

### Requisitos

- Node.js 18 o superior
- Firebase CLI

### Instalación

```bash
npm install
```

### Despliegue

```bash
npm run deploy
```

### Pruebas Locales

```bash
npm run serve
```

## Notas Importantes

- Asegúrate de que la aplicación cliente esté almacenando correctamente los tokens FCM en Firestore.
- La estructura de datos en Firestore debe seguir el patrón descrito anteriormente.
- Las notificaciones fallidas tendrán un campo `errorMessage` con detalles del error.