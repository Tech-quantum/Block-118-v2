import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// تابع راه‌اندازی فایربیس (هم برای لوکال و هم برای سرور)
function initFirebase() {
  if (getApps().length > 0) return;
  
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // در محیط Vercel از متغیر محیطی می‌خوانیم
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // در محیط لوکال از فایل می‌خوانیم
    const filePath = path.join(process.cwd(), 'serviceAccountKey.json');
    serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  
  initializeApp({ credential: cert(serviceAccount) });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const email = `${username}@block118.app`;

  try {
    initFirebase();
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) throw new Error('FIREBASE_API_KEY is missing');

    // ۱. لاگین با REST API فایربیس (چون Admin SDK متد لاگین با رمز ندارد)
    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const authData = await authResponse.json();
    if (!authResponse.ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ۲. بررسی نقش و گرفتن اطلاعات
    const isAdmin = username === 'admin';
    let userData = null;

    if (!isAdmin) {
      const db = getFirestore();
      const unitDoc = await db.collection('units').doc(username).get();
      if (unitDoc.exists) {
        userData = { id: unitDoc.id, ...unitDoc.data() };
      }
    }

    // ۳. برگرداندن نتیجه
    return res.status(200).json({
      token: authData.idToken,
      refreshToken: authData.refreshToken,
      user: {
        role: isAdmin ? 'admin' : 'resident',
        username: username,
        name: isAdmin ? 'مدیر ساختمان' : `ساکن واحد ${username}`,
        unitData: userData,
      },
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
