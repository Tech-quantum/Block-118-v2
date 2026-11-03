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
      let url = `${BASE}/transactions`;
      let options: any = { headers: { Authorization: `Bearer ${token}` } };
      
      if (!isAdmin) {
        url = `${BASE}:runQuery`;
        options.method = 'POST';
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "transactions" }],
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

      const transactions = docs.map(parseDoc).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.status(200).json({ transactions });
      
    } else if (req.method === 'POST') {
      if (!isAdmin) return res.status(403).json({ error: 'فقط مدیر دسترسی دارد' });

      const { unit, amount, type, description } = req.body; // type: 'charge' (بدهکار) یا 'payment' (پرداخت)
      if (!unit || !amount || !type) return res.status(400).json({ error: 'اطلاعات ناقص است' });

      // ۱. گرفتن بدهی فعلی واحد
      const unitRes = await fetch(`${BASE}/units/${unit}`, { headers: { Authorization: `Bearer ${token}` } });
      const unitData = await unitRes.json();
      let currentDebt = Number(unitData.fields?.debt?.integerValue || 0);

      // ۲. محاسبه بدهی جدید
      let newDebt = type === 'charge' ? currentDebt + Number(amount) : currentDebt - Number(amount);
      if (newDebt < 0) newDebt = 0; // بدهی منفی نمی‌شود

      // ۳. آپدیت بدهی در کالکشن واحدها
      await fetch(`${BASE}/units/${unit}?updateMask.fieldPaths=debt`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { debt: { integerValue: String(newDebt) } } })
      });

      // ۴. ثبت تراکنش در تاریخچه
      const transactionBody = {
        fields: {
          unit: { stringValue: unit },
          amount: { integerValue: String(amount) },
          type: { stringValue: type },
          description: { stringValue: description || '' },
          createdAt: { timestampValue: new Date().toISOString() }
        }
      };

      await fetch(`${BASE}/transactions`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(transactionBody)
      });

      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
  }
