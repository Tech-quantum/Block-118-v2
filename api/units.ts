import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });

  const token = authHeader.split('Bearer ')[1];

  try {
    initFirebase();
    const decodedToken = await getAuth().verifyIdToken(token);
    const username = decodedToken.email?.split('@')[0];
    const isAdmin = username === 'admin';
    const db = getFirestore();

    if (isAdmin) {
      // حذف orderBy برای جلوگیری از خطای ایندکس
      const snapshot = await db.collection('units').get();
      const units = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // مرتب سازی در سمت سرور (جاوااسکریپت)
      units.sort((a: any, b: any) => a.unitNumber.localeCompare(b.unitNumber));
      
      return res.status(200).json({ units });
    } else {
      const unitDoc = await db.collection('units').doc(username as string).get();
      if (!unitDoc.exists) return res.status(404).json({ error: 'Unit not found' });
      return res.status(200).json({ units: [{ id: unitDoc.id, ...unitDoc.data() }] });
    }
  } catch (error: any) {
    console.error('Fetch units error:', error);
    // نمایش خطای دقیق برای دیباگ
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
