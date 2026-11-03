import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split('Bearer ')[1];
  
  const PROJECT = "block-118-f2918";
  const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

  try {
    const fsRes = await fetch(`${BASE}/summary/stats`, { headers: { Authorization: `Bearer ${token}` } });
    if (!fsRes.ok) return res.status(200).json({ fundBalance: 0 }); 
    
    const data = await fsRes.json();
    const balance = Number(data.fields?.fundBalance?.integerValue || 0);
    
    return res.status(200).json({ fundBalance: balance });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
