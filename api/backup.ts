import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split('Bearer ')[1];
  const apiKey = process.env.FIREBASE_API_KEY;

  try {
    // بررسی اینکه کاربر ادمین است
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token })
    });
    const authData = await authRes.json();
    const email = authData.users?.[0]?.email;
    if (email !== 'admin@block118.app') {
      return res.status(403).json({ error: 'Forbidden: Only admin can backup' });
    }

    const PROJECT = "block-118-f2918";
    const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
    const collections = ['units', 'requests', 'messages', 'transactions', 'announcements'];
    
    const backupData: any = {};

    const parseValue = (val: any) => {
      if (val.stringValue !== undefined) return val.stringValue;
      if (val.integerValue !== undefined) return Number(val.integerValue);
      if (val.doubleValue !== undefined) return val.doubleValue;
      if (val.booleanValue !== undefined) return val.booleanValue;
      if (val.timestampValue !== undefined) return val.timestampValue;
      if (val.nullValue !== undefined) return null;
      return null;
    };
    
    const parseDoc = (doc: any) => {
      const id = doc.name.split('/').pop();
      const fields = doc.fields || {};
      const result: any = { id };
      for (const key in fields) result[key] = parseValue(fields[key]);
      return result;
    };

    // دریافت همه کالکشن‌ها
    for (const col of collections) {
      const fsRes = await fetch(`${BASE}/${col}`, { headers: { Authorization: `Bearer ${token}` } });
      if (fsRes.ok) {
        const data = await fsRes.json();
        backupData[col] = (data.documents || []).map(parseDoc);
      } else {
        backupData[col] = [];
      }
    }

    return res.status(200).json(backupData);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
