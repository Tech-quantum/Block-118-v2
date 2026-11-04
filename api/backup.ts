import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROJECT = "block-118-f2918";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

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
    if (email !== 'admin@block118.app') {
      return res.status(403).json({ error: 'Forbidden: Only admin can backup or reset' });
    }

    // 👈 بخش جدید: ریست کردن اطلاعات مالی (فقط با درخواست POST)
    if (req.method === 'POST' && req.query.mode === 'reset') {
      console.log("شروع عملیات ریست توسط ادمین...");

      // ۱. صفر کردن بدهی واحدها
      const unitsRes = await fetch(`${BASE}/units`, { headers: { Authorization: `Bearer ${token}` } });
      const unitsData = await unitsRes.json();
      const units = unitsData.documents || [];
      for (const unit of units) {
        const unitId = unit.name.split('/').pop();
        await fetch(`${BASE}/units/${unitId}?updateMask.fieldPaths=debt`, {
          method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: { debt: { integerValue: "0" } } })
        });
      }

      // ۲. حذف تراکنش‌ها
      const transRes = await fetch(`${BASE}/transactions`, { headers: { Authorization: `Bearer ${token}` } });
      const transData = await transRes.json();
      for (const t of (transData.documents || [])) {
        await fetch(`${BASE}/transactions/${t.name.split('/').pop()}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      }

      // ۳. حذف هزینه‌ها
      const expRes = await fetch(`${BASE}/expenses`, { headers: { Authorization: `Bearer ${token}` } });
      const expData = await expRes.json();
      for (const e of (expData.documents || [])) {
        await fetch(`${BASE}/expenses/${e.name.split('/').pop()}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      }

      // ۴. صفر کردن صندوق
      await fetch(`${BASE}/summary/stats?updateMask.fieldPaths=fundBalance`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { fundBalance: { integerValue: "0" } } })
      });

      return res.status(200).json({ success: true, message: 'اطلاعات مالی با موفقیت صفر شد.' });
    }

    // بخش قبلی بکاپ‌گیری
    const collections = ['units', 'requests', 'messages', 'transactions', 'expenses', 'announcements'];
    const backupData: any = {};
    const parseValue = (val: any) => {
      if (val.stringValue !== undefined) return val.stringValue;
      if (val.integerValue !== undefined) return Number(val.integerValue);
      if (val.timestampValue !== undefined) return val.timestampValue;
      if (val.booleanValue !== undefined) return val.booleanValue;
      return null;
    };
    const parseDoc = (doc: any) => {
      const id = doc.name.split('/').pop();
      const fields = doc.fields || {};
      const result: any = { id };
      for (const key in fields) result[key] = parseValue(fields[key]);
      return result;
    };

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
