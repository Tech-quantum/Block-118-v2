import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split('Bearer ')[1];
  const { id } = req.query; 
  const { status } = req.body;

  try {
    const PROJECT = "block-118-f2918";
    const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/requests/${id}`;
    
    const fsRes = await fetch(`${BASE}?updateMask.fieldPaths=status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { status: { stringValue: status } } })
    });
    if (!fsRes.ok) throw new Error('Failed to update');
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
