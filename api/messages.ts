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
      // واکشی پیام‌ها با runQuery برای اعمال فیلترها
      const url = `${BASE}:runQuery`;
      let body: any = { structuredQuery: { from: [{ collectionId: "messages" }] } };

      // اگر ساکن بود، فقط پیام‌های گروهی، پیام‌های خودش و پیام‌هایی که به او داده شده
      if (!isAdmin) {
        body.structuredQuery.where = {
          compositeFilter: {
            op: "OR",
            filters: [
              { fieldFilter: { field: { fieldPath: "receiver" }, op: "EQUAL", value: { stringValue: "all" } } },
              { fieldFilter: { field: { fieldPath: "receiver" }, op: "EQUAL", value: { stringValue: username } } },
              { fieldFilter: { field: { fieldPath: "sender" }, op: "EQUAL", value: { stringValue: username } } }
            ]
          }
        };
      }

      const fsRes = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const fsData = await fsRes.json();
      
      const docs = fsData.filter((r: any) => r.document).map((r: any) => r.document);
      
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

      const messages = docs.map(parseDoc).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return res.status(200).json({ messages });
      
    } else if (req.method === 'POST') {
      const { receiver, text } = req.body;
      if (!receiver || !text) return res.status(400).json({ error: 'Missing fields' });

      const url = `${BASE}/messages`;
      const body = {
        fields: {
          sender: { stringValue: username },
          receiver: { stringValue: receiver },
          text: { stringValue: text },
          createdAt: { timestampValue: new Date().toISOString() }
        }
      };

      const fsRes = await fetch(url, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!fsRes.ok) throw new Error('Failed to send message');
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
