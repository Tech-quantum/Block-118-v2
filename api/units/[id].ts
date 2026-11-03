import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });

  const token = authHeader.split('Bearer ')[1];
  const apiKey = process.env.FIREBASE_API_KEY;
  const { id } = req.query; 
  const { owner, status, debt } = req.body;

  try {
    // ۱. چک کردن اینکه کاربر ادمین است یا خیر
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token })
    });
    const authData = await authRes.json();
    const email = authData.users?.[0]?.email;
    if (email !== 'admin@block118.app') return res.status(403).json({ error: 'Forbidden' });

    // ۲. آپدیت در فایربیس
    const PROJECT = "block-118-f2918";
    const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/units/${id}`;
    
    // فقط فیلدهایی که تغییر کرده‌اند را آپدیت می‌کنیم
    const updateMask = [];
    const fields: any = {};
    
    if (owner !== undefined) { fields.owner = owner ? { stringValue: owner } : { nullValue: null }; updateMask.push('owner'); }
    if (status !== undefined) { fields.status = { stringValue: status }; updateMask.push('status'); }
    if (debt !== undefined) { fields.debt = { integerValue: String(debt) }; updateMask.push('debt'); }

    const url = `${BASE}?updateMask.fieldPaths=${updateMask.join('&updateMask.fieldPaths=')}`;
    
    const fsRes = await fetch(url, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });

    if (!fsRes.ok) throw new Error('Failed to update in Firestore');
    
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
