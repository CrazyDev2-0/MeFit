importScripts('https://www.gstatic.com/firebasejs/8.2.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.2.0/firebase-messaging.js');


const firebaseConfig = {
    apiKey: "AIzaSyDny8RHCF2K5TF53g8j1dxOH9CHS5qXu4E",
    authDomain: "optum-monitoring-app.firebaseapp.com",
    projectId: "optum-monitoring-app",
    storageBucket: "optum-monitoring-app.appspot.com",
    messagingSenderId: "744642209859",
    appId: "1:744642209859:web:aa69ba8b50ee73965c0cf6"
};

const app = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging(app);


messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title+" -- realyed background mssage handler";
    const notificationOptions = {
        body: payload.notification.body
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});

messaging.onMessage(function (payload) {
    console.log('Message received. ', payload);
});     
