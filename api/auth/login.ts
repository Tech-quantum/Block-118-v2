import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  const email = `${username}@block118.app`;
  const apiKey = process.env.FIREBASE_API_KEY;

  try {
    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const authData = await authResponse.json();
    if (!authResponse.ok) return res.status(401).json({ error: 'Invalid credentials' });

    const isAdmin = username === 'admin';

    return res.status(200).json({
      token: authData.idToken,
      refreshToken: authData.refreshToken,
      user: {
        role: isAdmin ? 'admin' : 'resident',
        username: username,
        name: isAdmin ? 'مدیر ساختمان' : `ساکن واحد ${username}`,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
