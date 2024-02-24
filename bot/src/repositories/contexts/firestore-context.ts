import { cert, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../../../../bot/src/config/firestore.json';

initializeApp({
    credential: cert(serviceAccount as ServiceAccount)
})

export const firestore = getFirestore();