const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// ---- Auth API ----------------------------------------------------

app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const existingUser = await db.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'That username is already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.createUser({ username, passwordHash });

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const user = await db.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

app.get('/api/session', (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true, username: req.session.username });
  } else {
    res.json({ loggedIn: false });
  }
});

// ---- Route protection ---------------------------------------------

function requireAuth(req, res, next) {
  if (req.session.userId) return next();
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  res.redirect('/login.html');
}

app.get('/', (req, res) => {
  res.redirect(req.session.userId ? '/calculator.html' : '/login.html');
});

app.get('/calculator.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'calculator.html'));
});

// ---- Budget API -----------------------------------------------------

app.get('/api/budget', requireAuth, async (req, res) => {
  try {
    const budget = await db.getBudget(req.session.userId);
    res.json(budget);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve budget.' });
  }
});

app.post('/api/budget', requireAuth, async (req, res) => {
  const { income, expenses, savings, debt } = req.body || {};
  try {
    const budget = await db.saveBudget(req.session.userId, { income, expenses, savings, debt });
    res.json(budget);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save budget.' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Running at http://localhost:${PORT}`);
});