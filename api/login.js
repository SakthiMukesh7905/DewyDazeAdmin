const { isValidCredentials, sign, createAuthCookie } = require('./_auth');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};
  if (!username || !password || !isValidCredentials(username, password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = sign({ username, exp: Date.now() + 60 * 60 * 1000 });
  res.setHeader('Set-Cookie', createAuthCookie(token));
  return res.status(200).json({ authenticated: true });
};
