import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    initFirebase();
    const decodedToken = await getAuth().verifyIdToken(token);
    const username = decodedToken.email?.split('@')[0];
    const isAdmin = username === 'admin';

    return res.status(200).json({
      valid: true,
      user: {
        role: isAdmin ? 'admin' : 'resident',
        username: username,
        name: isAdmin ? 'مدیر ساختمان' : `ساکن واحد ${username}`,
      },
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
