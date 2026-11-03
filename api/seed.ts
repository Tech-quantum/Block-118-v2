import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

function initFirebase() {
  if (getApps().length > 0) return;
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    const filePath = path.join(process.cwd(), 'serviceAccountKey.json');
    serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  initializeApp({ credential: cert(serviceAccount) });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    initFirebase();
    const db = getFirestore();
    const batch = db.batch();
    const unitsRef = db.collection('units');

    let count = 0;
    for (let floor = 1; floor <= 10; floor++) {
      for (let unit = 1; unit <= 4; unit++) {
        const unitNumber = `${floor}0${unit}`; // 101, 102, ... 404
        const docRef = unitsRef.doc(unitNumber);
        
        batch.set(docRef, {
          unitNumber: unitNumber,
          floor: floor,
          owner: null,
          status: 'vacant',
          debt: 0,
        });
        count++;
      }
    }

    await batch.commit();
    return res.status(200).json({ message: `با موفقیت ${count} واحد ساخته شد.` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
