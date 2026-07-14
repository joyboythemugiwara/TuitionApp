importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// This uses process.env placeholders that standard build tools won't replace in public folder,
// so typically we hardcode or use a script to inject. For now, since the user's config is basic, we will 
// hardcode dummy or use url search params if needed. But usually, we just initialize with the standard config.
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForDevelopment123",
  authDomain: "tuitionapp.firebaseapp.com",
  projectId: "tuitionapp",
  storageBucket: "tuitionapp.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
