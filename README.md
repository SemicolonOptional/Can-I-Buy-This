# Can I Buy This?

Affordability calculator with basic username/password accounts.

## Structure

```
server.js          Express app: auth routes + route protection
db.js               Tiny JSON-file user store (swap for a real DB later)
data/users.json     Created automatically on first signup
public/
  login.html
  signup.html
  calculator.html   Protected — redirects to /login.html if not signed in
  auth.js           Shared login/signup form handling
  calculator.js      Calculator logic + logout
  style.css          Shared styles
```

## Run it

```
npm install
npm start
```

Then open http://localhost:3000 — you'll land on the login page.
Sign up for an account, and you'll be dropped into the calculator.

## How auth works

- Passwords are hashed with bcrypt before they're ever written to disk —
  plaintext passwords are never stored.
- Sessions are cookie-based (`express-session`), currently using the
  default in-memory store, so sessions reset when the server restarts.
  For anything beyond local dev, swap in a persistent session store
  (e.g. `connect-sqlite3` or `connect-redis`).
- `/calculator.html` is the only route gated by `requireAuth` right now.
  Any future page or API route that should require login just needs the
  same middleware.

## Known basic-structure limitations (for later)

- User storage is a flat JSON file — fine for one dev instance, not for
  concurrent writes or production traffic.
- No password reset flow yet.
- No "remember calculations" / history per account yet — the calculator
  still runs entirely client-side and doesn't persist results.
- No rate limiting on login/signup.
