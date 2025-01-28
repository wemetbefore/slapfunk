import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
// Follow this pattern to import other Firebase services
// import { } from 'firebase/<service>';
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = serviceAccount;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get a list of cities from your database
async function getSubscriptions(db) {
    const subscriptionsCol = collection(db, 'subscriptions');
    const subscriptionsSnapshot = await getDocs(subscriptionsCol);
    const subscriptionsList = subscriptionsSnapshot.docs.map(doc => doc.data());
    return subscriptionsList;
}
let subs = getSubscriptions(db);
console.log(subs);