// ===========================================
// Firebase Client-Side Configuration
// ===========================================

const firebaseConfig = {
    apiKey: "AIzaSyANCiq9p-yG_34bdaKLip2RmHTSS-aKSe4",
    authDomain: "minilinkedin-32ad5.firebaseapp.com",
    projectId: "minilinkedin-32ad5",
    storageBucket: "minilinkedin-32ad5.firebasestorage.app",
    messagingSenderId: "335148581339",
    appId: "1:335148581339:web:cb3b6659cef1f4f92de7fe",
    measurementId: "G-3HF9ERR60X"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make config accessible globally
window.firebaseConfig = firebaseConfig;
