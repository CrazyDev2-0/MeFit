// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDny8RHCF2K5TF53g8j1dxOH9CHS5qXu4E",
  authDomain: "optum-monitoring-app.firebaseapp.com",
  projectId: "optum-monitoring-app",
  storageBucket: "optum-monitoring-app.appspot.com",
  messagingSenderId: "744642209859",
  appId: "1:744642209859:web:b77c440350dee7085c0cf6"
};

// Initialize Firebase
const firebaseapp = initializeApp(firebaseConfig);

export default firebaseapp;