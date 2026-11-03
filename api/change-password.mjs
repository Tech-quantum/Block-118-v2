const API_KEY =
  process.env.FIREBASE_API_KEY || "AIzaSyDwojnNPEpQKADXEXLNI4avDdtDlu9s5qw";
const HEADERS = {
  "Content-Type": "application/json",
  Referer: "https://block-118.vercel.app/",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method" });
  }
  const { email, currentPassword, newPassword } = req.body || {};
  if (
    typeof email !== "string" ||
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    !email.endsWith("@block118.app")
  ) {
    return res.status(400).json({ error: "bad-request" });
  }
  if (newPassword.length < 6 || newPassword.length > 128) {
    return res.status(400).json({ error: "WEAK_PASSWORD" });
  }
  try {
    // ۱) تأیید رمز فعلی
    const l = await fetch(
      "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" +
        API_KEY,
      {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({
          email,
          password: currentPassword,
          returnSecureToken: true,
        }),
      }
    );
    const ld = await l.json();
    if (!l.ok) {
      return res
        .status(401)
        .json({ error: (ld.error && ld.error.message) || "auth-error" });
    }
    // ۲) ثبت رمز جدید
    const u = await fetch(
      "https://identitytoolkit.googleapis.com/v1/accounts:update?key=" +
        API_KEY,
      {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({
          idToken: ld.idToken,
          password: newPassword,
          returnSecureToken: true,
        }),
      }
    );
    const ud = await u.json();
    if (!u.ok) {
      return res
        .status(400)
        .json({ error: (ud.error && ud.error.message) || "update-failed" });
    }
    return res.status(200).json({
      idToken: ud.idToken,
      refreshToken: ud.refreshToken,
      expiresIn: ud.expiresIn,
      email,
    });
  } catch (e) {
    return res.status(502).json({ error: "upstream-failed" });
  }
}
