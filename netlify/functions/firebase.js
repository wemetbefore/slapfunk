const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!initializeApp.apps?.length) {
    initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = getFirestore();

module.exports = { db };

