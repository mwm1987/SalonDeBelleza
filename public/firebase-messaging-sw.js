importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD8i5Birp1dhkiflPd5-QJs5pAKrBZfI4A",
  authDomain: "secretosdebza.firebaseapp.com",
  projectId: "secretosdebza",
  storageBucket: "secretosdebza.firebasestorage.app",
  messagingSenderId: "6397264098",
  appId: "1:6397264098:web:54ef506cd96b4cc4365ebb"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Manejar mensajes en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Verificar que la notificación existe en el payload
  if (payload.notification) {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/images/logosecretos.png',
      badge: '/images/logosecretos.png', // Agregar badge para mejor UX
      data: payload.data || {} // Preservar datos adicionales
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received.', event);
  event.notification.close();
  
  // Abrir o enfocar la ventana de la aplicación
  event.waitUntil(
    self.clients.matchAll({type: 'window'}).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Manejar la instalación del service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  event.waitUntil(self.clients.claim());
});