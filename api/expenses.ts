import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROJECT = "block-118-f2918";
// 👈 آدرس پایه باید به روت دیتابیس اشاره کند تا هم تراکنش‌ها و هم هزینه‌ها را بخواند
const DOCS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const EXPENSES_URL = `${DOCS_BASE}/expenses`;

async function updateSummary(token: string) {
  try {
    // خواندن کل تراکنش‌ها و هزینه‌ها برای محاسبه
    const transRes = await fetch(`${DOCS_BASE}/transactions`, { headers: { Authorization: `Bearer ${token}` } });
    const expRes = await fetch(EXPENSES_URL, { headers: { Authorization: `Bearer ${token}` } });
    
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
    
    // 👈 تغییر به PUT برای آپدیت حتمی سند صندوق
    const res = await fetch(`${DOCS_BASE}/summary/stats`, {
      method: 'PUT', 
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { fundBalance: { integerValue: String(fundBalance) } } })
    });

    if (!res.ok) {
      console.error("خطای فایربیس در آپدیت صندوق (Expenses):", await res.text());
    } else {
      console.log("صندوق با موفقیت در فایل هزینه‌ها آپدیت شد:", fundBalance);
    }
  } catch (e) {
    console.error("خطای غیرمنتظره در آپدیت صندوق (Expenses):", e);
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
    const isAdmin = authData.users?.[0]?.email === 'admin@block118.app';

    if (req.method === 'GET') {
      const fsRes = await fetch(EXPENSES_URL, { headers: { Authorization: `Bearer ${token}` } });
      const fsData = await fsRes.json();
      const parseValue = (val: any) => val.stringValue !== undefined ? val.stringValue : val.integerValue !== undefined ? Number(val.integerValue) : val.timestampValue;
      const expenses = (fsData.documents || []).map((doc: any) => {
        const docId = doc.name.split('/').pop();
        const fields = doc.fields || {};
        const result: any = { id: docId };
        for (const key in fields) result[key] = parseValue(fields[key]);
        return result;
      }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
      await fetch(EXPENSES_URL, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      
      // 👈 آپدیت صندوق
      await updateSummary(token);
      return res.status(200).json({ success: true });

    } else if (req.method === 'PATCH') {
      if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing ID' });
      const { title, amount, description } = req.body;
      
      const updateMask = ['title', 'amount', 'description'];
      const fields = {
        title: { stringValue: title },
        amount: { integerValue: String(amount) },
        description: { stringValue: description || '' }
      };
      await fetch(`${EXPENSES_URL}/${id}?updateMask.fieldPaths=${updateMask.join('&updateMask.fieldPaths=')}`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields })
      });
      
      // 👈 آپدیت صندوق
      await updateSummary(token);
      return res.status(200).json({ success: true });

    } else if (req.method === 'DELETE') {
      if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing ID' });
      
      await fetch(`${EXPENSES_URL}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      
      // 👈 آپدیت صندوق
      await updateSummary(token);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
