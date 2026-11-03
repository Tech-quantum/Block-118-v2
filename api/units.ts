import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });

  const token = authHeader.split('Bearer ')[1];
  const apiKey = process.env.FIREBASE_API_KEY;

  try {
    // ۱. پیدا کردن نام کاربری از روی توکن (با REST API)
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token })
    });
    const authData = await authRes.json();
    if (!authData.users || authData.users.length === 0) throw new Error('Invalid token');
    
    const email = authData.users[0].email;
    const username = email.split('@')[0];
    const isAdmin = username === 'admin';

    // ۲. خواندن اطلاعات از فایربیس (با REST API)
    const PROJECT = "block-118-f2918";
    const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
    
    let url = `${BASE}/units`;
    if (!isAdmin) url = `${BASE}/units/${username}`;

    const fsRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!fsRes.ok) throw new Error('Failed to fetch from Firestore');
    
    const fsData = await fsRes.json();

    // ۳. تبدیل فرمت فایربیس به JSON معمولی
    const parseValue = (val: any) => {
      if (val.stringValue !== undefined) return val.stringValue;
      if (val.integerValue !== undefined) return Number(val.integerValue);
      if (val.doubleValue !== undefined) return val.doubleValue;
      if (val.booleanValue !== undefined) return val.booleanValue;
      if (val.timestampValue !== undefined) return val.timestampValue;
      return null;
    };

    const parseDoc = (doc: any) => {
      const id = doc.name.split('/').pop();
      const fields = doc.fields || {};
      const result: any = { id };
      for (const key in fields) result[key] = parseValue(fields[key]);
      return result;
    };

    let units = [];
    if (isAdmin) {
      units = (fsData.documents || []).map(parseDoc);
      units.sort((a: any, b: any) => { if (a.floor !== b.floor) return (a.floor || 0) - (b.floor || 0); return (a.unitNumber || '').localeCompare(b.unitNumber || ''); });
    } else if (fsData.name) {
      units = [parseDoc(fsData)];
    }

    return res.status(200).json({ units });
  } catch (error: any) {
    console.error('Fetch units error:', error);
    return res.status(500).json({ error: error.message });
  }
}
