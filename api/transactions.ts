import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROJECT = "block-118-f2918";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

async function updateSummary(token: string) {
  try {
    const transRes = await fetch(`${BASE}/transactions`, { headers: { Authorization: `Bearer ${token}` } });
    const expRes = await fetch(`${BASE}/expenses`, { headers: { Authorization: `Bearer ${token}` } });
    
    const transData = await transRes.json();
    const expData = await expRes.json();
    
    let totalPayments = 0;
    (transData.documents || []).forEach((doc: any) => {
      if (doc.fields.type?.stringValue === 'payment') totalPayments += Number(doc.fields.amount?.integerValue || 0);
    });
    
    let totalExpenses = 0;
    (expData.documents || []).forEach((doc: any) => {
      totalExpenses += Number(doc.fields.amount?.integerValue || 0);
    });
    
    const fundBalance = totalPayments - totalExpenses;
    
    // 👈 اصلاح شد: استفاده از PATCH با updateMask
    const res = await fetch(`${BASE}/summary/stats?updateMask.fieldPaths=fundBalance`, {
      method: 'PATCH', 
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { fundBalance: { integerValue: String(fundBalance) } } })
    });

    if (!res.ok) {
      console.error("❌ خطای فایربیس در آپدیت صندوق:", await res.text());
    } else {
      console.log("✅ صندوق با موفقیت آپدیت شد به:", fundBalance);
    }
  } catch (e) {
    console.error("❌ خطای غیرمنتظره در آپدیت صندوق:", e);
  }
}

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

    if (req.method === 'GET') {
      if (req.query.mode === 'summary') {
        const fsRes = await fetch(`${BASE}/summary/stats`, { headers: { Authorization: `Bearer ${token}` } });
        if (!fsRes.ok) return res.status(200).json({ fundBalance: 0 }); 
        const data = await fsRes.json();
        const balance = data.fields?.fundBalance?.integerValue !== undefined 
          ? Number(data.fields.fundBalance.integerValue) 
          : 0;
        return res.status(200).json({ fundBalance: balance });
      }

      let url = `${BASE}/transactions`;
      let options: any = { headers: { Authorization: `Bearer ${token}` } };
      if (!isAdmin) {
        url = `${BASE}:runQuery`;
        options.method = 'POST';
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify({
          structuredQuery: { from: [{ collectionId: "transactions" }], where: { fieldFilter: { field: { fieldPath: "unit" }, op: "EQUAL", value: { stringValue: username } } } }
        });
      }
      const fsRes = await fetch(url, options);
      const fsData = await fsRes.json();
      let docs = isAdmin ? (fsData.documents || []) : (fsData.filter((r: any) => r.document).map((r: any) => r.document));
      const parseValue = (val: any) => val.stringValue !== undefined ? val.stringValue : val.integerValue !== undefined ? Number(val.integerValue) : val.timestampValue;
      const transactions = docs.map((doc: any) => {
        const id = doc.name.split('/').pop();
        const fields = doc.fields || {};
        const result: any = { id };
        for (const key in fields) result[key] = parseValue(fields[key]);
        return result;
      }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.status(200).json({ transactions });
      
    } else if (req.method === 'POST') {
      if (!isAdmin) return res.status(403).json({ error: 'فقط مدیر دسترسی دارد' });
      const { unit, amount, type, description } = req.body;

      if (unit === 'all') {
        const unitsRes = await fetch(`${BASE}/units`, { headers: { Authorization: `Bearer ${token}` } });
        const unitsData = await unitsRes.json();
        const units = unitsData.documents || [];
        await Promise.all(units.map(async (u: any) => {
          const unitNum = u.fields.unitNumber.stringValue;
          let currentDebt = Number(u.fields.debt?.integerValue || 0);
          let newDebt = type === 'charge' ? currentDebt + Number(amount) : currentDebt - Number(amount);
          await fetch(`${BASE}/units/${unitNum}?updateMask.fieldPaths=debt`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { debt: { integerValue: String(newDebt) } } }) });
          await fetch(`${BASE}/transactions`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { unit: { stringValue: unitNum }, amount: { integerValue: String(amount) }, type: { stringValue: type }, description: { stringValue: description || '' }, createdAt: { timestampValue: new Date().toISOString() } } }) });
        }));
      } else {
        const unitRes = await fetch(`${BASE}/units/${unit}`, { headers: { Authorization: `Bearer ${token}` } });
        const unitData = await unitRes.json();
        let currentDebt = Number(unitData.fields?.debt?.integerValue || 0);
        let newDebt = type === 'charge' ? currentDebt + Number(amount) : currentDebt - Number(amount);
        await fetch(`${BASE}/units/${unit}?updateMask.fieldPaths=debt`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { debt: { integerValue: String(newDebt) } } }) });
        await fetch(`${BASE}/transactions`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { unit: { stringValue: unit }, amount: { integerValue: String(amount) }, type: { stringValue: type }, description: { stringValue: description || '' }, createdAt: { timestampValue: new Date().toISOString() } } }) });
      }
      
      await updateSummary(token);
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
          }
