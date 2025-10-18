# 💇‍♀️ Aplicación para Salón de Belleza

Este es un proyecto full-stack diseñado para la gestión de un salón de belleza. Incluye una aplicación de cliente para la reserva de turnos y un potente backend serverless para automatizar notificaciones y procesos administrativos.

## ✨ Características Principales

*   **Gestión de Turnos**: Los clientes pueden reservar, ver y gestionar sus turnos.
*   **Sistema de Notificaciones Automatizado**:
    *   Confirmación inmediata al reservar un turno.
    *   Notificación de cancelación.
    *   Recordatorios automáticos 3 horas antes de cada turno.
*   **Comunicación con Clientes**: Los administradores pueden enviar notificaciones push individuales o masivas (promociones, anuncios) a todos los clientes.
*   **Interfaz Moderna**: Interfaz de usuario limpia y responsiva construida con las últimas tecnologías de frontend.

## 🛠️ Pila Tecnológica (Tech Stack)

El proyecto está dividido en dos partes principales:

### Frontend (Directorio Raíz)

*   **Framework**: React con Vite
*   **Lenguaje**: TypeScript
*   **UI**: shadcn/ui - Componentes reutilizables y accesibles.
*   **Estilos**: Tailwind CSS - Un framework CSS utility-first.

### Backend (`/functions` directory)

*   **Plataforma**: Firebase
*   **Lógica Serverless**: Cloud Functions para Firebase (escritas en TypeScript).
*   **Base de Datos**: Cloud Firestore (NoSQL).
*   **Notificaciones Push**: Firebase Cloud Messaging (FCM).

Para más detalles sobre el backend, consulta el `README` de las funciones.

## 🚀 Puesta en Marcha

Sigue estos pasos para configurar y ejecutar el proyecto en un entorno de desarrollo local.

### Requisitos Previos

*   **Node.js**: v18 o superior.
*   **pnpm**: Gestor de paquetes (`npm install -g pnpm`).
*   **Firebase CLI**: (`npm install -g firebase-tools`).

### 1. Clonar el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_DIRECTORIO>
```

### 2. Configurar el Frontend

En el directorio raíz del proyecto, instala las dependencias:

```bash
pnpm i
```

**Start Preview**

```shell
pnpm run dev
```

**To build**

```shell
pnpm run build
```
