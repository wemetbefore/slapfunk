import { initializeApp } from 'firebase/app';

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = process.env.FIREBASE_SERVICE_ACCOUNT;

const app = initializeApp(firebaseConfig);