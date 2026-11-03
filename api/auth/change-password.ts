import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  
  const token = authHeader.split('Bearer ')[1];
  const { newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' });
  }
  
  const apiKey = process.env.FIREBASE_API_KEY;
  
  try {
    // استفاده از REST API فایربیس برای تغییر رمز
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token, password: newPassword, returnSecureToken: true })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'خطا در تغییر رمز');
    
    // توکن جدید را برمی‌گردانیم تا کاربر لاگین بماند
    return res.status(200).json({ success: true, newToken: data.idToken });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}
