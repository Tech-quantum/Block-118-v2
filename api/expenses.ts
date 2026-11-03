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
    const isAdmin = email === 'admin@block118.app';

    const PROJECT = "block-118-f2918";
    const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/expenses`;
    const { id } = req.query; // گرفتن ID از آدرس

    if (req.method === 'GET') {
      const fsRes = await fetch(BASE, { headers: { Authorization: `Bearer ${token}` } });
      const fsData = await fsRes.json();
      const parseValue = (val: any) => {
        if (val.stringValue !== undefined) return val.stringValue;
        if (val.integerValue !== undefined) return Number(val.integerValue);
        if (val.timestampValue !== undefined) return val.timestampValue;
        return null;
      };
      const parseDoc = (doc: any) => {
        const docId = doc.name.split('/').pop();
        const fields = doc.fields || {};
        const result: any = { id: docId };
        for (const key in fields) result[key] = parseValue(fields[key]);
        return result;
      };
      const expenses = (fsData.documents || []).map(parseDoc).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.status(200).json({ expenses });
      
    } else if (req.method === 'POST') {
      if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
      const { title, amount, description } = req.body;
      if (!title || !amount) return res.status(400).json({ error: 'Missing fields' });
      const body = {
        fields: {
          title: { stringValue: title },
          amount: { integerValue: String(amount) },
          description: { stringValue: description || '' },
          createdAt: { timestampValue: new Date().toISOString() }
        }
      };
      await fetch(BASE, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      return res.status(200).json({ success: true });

    } else if (req.method === 'PATCH') {
      if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
      if (!id) return res.status(400).json({ error: 'Missing ID' });
      const { title, amount, description } = req.body;
      const updateMask = ['title', 'amount', 'description'];
      const fields = {
        title: { stringValue: title },
        amount: { integerValue: String(amount) },
        description: { stringValue: description || '' }
      };
      await fetch(`${BASE}/${id}?updateMask.fieldPaths=${updateMask.join('&updateMask.fieldPaths=')}`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields })
      });
      return res.status(200).json({ success: true });

    } else if (req.method === 'DELETE') {
      if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
      if (!id) return res.status(400).json({ error: 'Missing ID' });
      await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
        }
