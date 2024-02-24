import { cert, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Configuration } from '../../config/configuraion';

initializeApp({
    credential: cert(JSON.parse(Configuration.firebaseConfigJson) as ServiceAccount),
})

export const firestore = getFirestore();