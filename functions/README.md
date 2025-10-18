# Backend con Cloud Functions para Salón de Belleza

Este proyecto contiene el backend serverless desarrollado con **Cloud Functions para Firebase**. Proporciona la lógica para gestionar notificaciones push, recordatorios de turnos y otras operaciones automatizadas de la aplicación.

## ✨ Características Principales

*   **Notificaciones Push Individuales**: Envío de notificaciones dirigidas a clientes específicos.
*   **Notificaciones Masivas**: Capacidad de enviar anuncios o promociones a todos los usuarios.
*   **Gestión de Turnos Automatizada**:
    *   Notificación de confirmación al crear un turno.
    *   Notificación de cancelación.
    *   Recordatorios automáticos 3 horas antes de un turno.
*   **Limpieza de Tokens FCM**: Detección y eliminación automática de tokens de notificación inválidos para mantener la base de datos limpia.

## 🚀 Estructura del Proyecto

*   `src/index.ts`: Punto de entrada principal. Contiene las funciones relacionadas con notificaciones individuales y la gestión de turnos.
*   `src/massNotifications.ts`: Contiene la lógica para el envío de notificaciones masivas.

## ⚙️ Descripción de las Cloud Functions

### Notificaciones Generales

*   `processNotifications`
    *   **Trigger**: Creación de un documento en `notifications/{notificationId}`.
    *   **Acción**: Lee la notificación con estado `pending`, busca los tokens FCM del `clientId` asociado y envía un mensaje push. Actualiza el estado a `sent` o `failed`.

*   `processMassNotifications`
    *   **Trigger**: Creación de un documento en `massNotifications/{notificationId}`.
    *   **Acción**: Envía una notificación push a **todos los usuarios** que tengan tokens FCM registrados en la aplicación. Ideal para anuncios generales.

### Gestión de Turnos

*   `onAppointmentCreated`
    *   **Trigger**: Creación de un documento en `appointments/{appointmentId}`.
    *   **Acción**: Envía una notificación de **confirmación de turno** al usuario que lo ha reservado.

*   `onAppointmentCancelled`
    *   **Trigger**: Actualización de un documento en `appointments/{appointmentId}` cuando el campo `status` cambia a `cancelled`.
    *   **Acción**: Envía una notificación de **cancelación de turno** al usuario afectado.

*   `checkUpcomingAppointments`
    *   **Trigger**: Función programada (Pub/Sub) que se ejecuta **cada hora**.
    *   **Acción**: Escanea la colección `appointments` en busca de turnos confirmados que ocurran dentro de las próximas 3 horas. Si encuentra uno y no se ha enviado un recordatorio previo, envía una notificación de **recordatorio de turno**.

## 📦 Modelos de Datos en Firestore

La correcta operación de las funciones depende de la siguiente estructura en Firestore:

```
users/{userId}/
  fcmTokens/{tokenId}
    - token: "..."
    - createdAt: ...

notifications/{notificationId}/
  - clientId: "..."
  - title: "..."
  - message: "..."
  - status: "pending" | "sent" | "failed"
  - ...

massNotifications/{notificationId}/
  - title: "..."
  - message: "..."
  - status: "pending" | "sent" | "failed"
  - ...

appointments/{appointmentId}/
  - userId: "..."
  - date: "YYYY-MM-DD"
  - time: "HH:mm"
  - status: "pending" | "confirmed" | "cancelled"
  - notificationSent3Hours: boolean
  - ...
```

## 🛠️ Despliegue y Desarrollo Local

### Requisitos Previos

- Node.js 18 o superior
- Firebase CLI

### Instalación de Dependencias

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