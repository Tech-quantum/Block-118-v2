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
    
    const username = email.split('@')[0];
    const isAdmin = username === 'admin';
    const PROJECT = "block-118-f2918";
    const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

    if (req.method === 'GET') {
      let url = `${BASE}/requests`;
      let options: any = { headers: { Authorization: `Bearer ${token}` } };
      
      if (!isAdmin) {
        url = `${BASE}:runQuery`;
        options.method = 'POST';
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "requests" }],
            where: { fieldFilter: { field: { fieldPath: "unit" }, op: "EQUAL", value: { stringValue: username } } }
          }
        });
      }

      const fsRes = await fetch(url, options);
      const fsData = await fsRes.json();
      
      let docs = isAdmin ? (fsData.documents || []) : (fsData.filter((r: any) => r.document).map((r: any) => r.document));
      
      const parseValue = (val: any) => {
        if (val.stringValue !== undefined) return val.stringValue;
        if (val.integerValue !== undefined) return Number(val.integerValue);
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

      const requests = docs.map(parseDoc).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.status(200).json({ requests });
      
    } else if (req.method === 'POST') {
      // دریافت فیلدهای جدید (image و thumbnail)
      const { title, description, image, thumbnail } = req.body;
      if (!title) return res.status(400).json({ error: 'Title required' });

      const url = `${BASE}/requests`;
      const fields: any = {
        unit: { stringValue: username },
        title: { stringValue: title },
        description: { stringValue: description || '' },
        status: { stringValue: 'pending' },
        createdAt: { timestampValue: new Date().toISOString() }
      };

      // اگر عکسی ارسال شده بود، آن را به فیلدها اضافه می‌کنیم
      if (image) fields.image = { stringValue: image };
      if (thumbnail) fields.thumbnail = { stringValue: thumbnail };

      const fsRes = await fetch(url, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields })
      });
      if (!fsRes.ok) throw new Error('Failed to create request');
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
