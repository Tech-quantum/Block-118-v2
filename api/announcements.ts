import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split('Bearer ')[1];
  const apiKey = process.env.FIREBASE_API_KEY;

  try {
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token })
    });
    const authData = await authRes.json();
    const email = authData.users?.[0]?.email;
    if (!email) return res.status(401).json({ error: 'Invalid token' });
    
    const isAdmin = email === 'admin@block118.app';
    const PROJECT = "block-118-f2918";
    const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

    if (req.method === 'GET') {
      const fsRes = await fetch(`${BASE}/announcements`, { headers: { Authorization: `Bearer ${token}` } });
      const fsData = await fsRes.json();
      
      const parseValue = (val: any) => {
        if (val.stringValue !== undefined) return val.stringValue;
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

      const announcements = (fsData.documents || []).map(parseDoc).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.status(200).json({ announcements });
      
    } else if (req.method === 'POST') {
      if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

      const { text, id } = req.body;
      if (!text) return res.status(400).json({ error: 'متن اطلاعیه الزامی است' });

      if (id) {
        // ویرایش اطلاعیه موجود
        await fetch(`${BASE}/announcements/${id}?updateMask.fieldPaths=text&updateMask.fieldPaths=createdAt`, {
          method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: { text: { stringValue: text }, createdAt: { timestampValue: new Date().toISOString() } } })
        });
      } else {
        // ایجاد اطلاعیه جدید
        await fetch(`${BASE}/announcements`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: { text: { stringValue: text }, createdAt: { timestampValue: new Date().toISOString() } } })
        });
      }
      return res.status(200).json({ success: true });

    } else if (req.method === 'DELETE') {
      if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
      const { id } = req.query;
      await fetch(`${BASE}/announcements/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
