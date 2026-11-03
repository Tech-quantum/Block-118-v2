import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split('Bearer ')[1];
  const { id } = req.query; 
  const apiKey = process.env.FIREBASE_API_KEY;

  try {
    // ۱. بررسی اینکه کاربر ادمین است
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token })
    });
    const authData = await authRes.json();
    const email = authData.users?.[0]?.email;
    if (email !== 'admin@block118.app') return res.status(403).json({ error: 'Forbidden' });

    const PROJECT = "block-118-f2918";
    const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/requests/${id}`;

    if (req.method === 'PATCH') {
      // تغییر وضعیت (در انتظار / در حال بررسی / انجام شد)
      const { status } = req.body;
      await fetch(`${BASE}?updateMask.fieldPaths=status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { status: { stringValue: status } } })
      });
      return res.status(200).json({ success: true });
    } 
    
    else if (req.method === 'DELETE') {
      // حذف هوشمندانه: وضعیت را deleted می‌کنیم و عکس اصلی (image) را null می‌کنیم
      await fetch(`${BASE}?updateMask.fieldPaths=status&updateMask.fieldPaths=image`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fields: { 
            status: { stringValue: 'deleted' },
            image: { nullValue: null } 
          } 
        })
      });
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
