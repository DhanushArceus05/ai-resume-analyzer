# Production Checklist

Use this before and after every production deploy.

## Environment variables

- [ ] `backend/.env` exists on the server (Render dashboard), is **not** committed
- [ ] `JWT_SECRET` is a long random value (`openssl rand -hex 32`), not the
      placeholder from `.env.example`
- [ ] `MONGODB_URI` points to Atlas, not `localhost`
- [ ] `GEMINI_API_KEY` is set and valid
- [ ] `CLIENT_URL` matches the real Vercel domain(s) exactly (including
      `https://`, no trailing slash)
- [ ] `NODE_ENV=production` is set on Render
- [ ] `VITE_API_BASE_URL` is set on Vercel and includes the `/api` suffix

## Database

- [ ] Atlas cluster is reachable (test with `mongosh` or Atlas's built-in
      connectivity check)
- [ ] Database user has a strong, unique password
- [ ] Network access rule matches your Render plan (`0.0.0.0/0` for free
      tier's dynamic IPs, or a static-IP allowlist on paid plans)
- [ ] Automated backups are enabled if this holds real user data (Atlas
      free tier does not include backups — consider a paid tier for
      production use)

## Backend (Render)

- [ ] `npm install` completes cleanly
- [ ] `npm start` boots without errors against the real `.env`
- [ ] `GET /api/health` returns `200`
- [ ] Root Directory is set to `backend`, Start Command is `npm start`
- [ ] Server correctly refuses to start if `JWT_SECRET` is missing
      (verified in `config/env.js` — fail-fast behavior, don't remove it)
- [ ] Logs show `MongoDB connected` on startup

## Frontend (Vercel)

- [ ] `npm run build` completes with no TypeScript errors
- [ ] Root Directory is set to `frontend`, Output Directory is `dist`
- [ ] `vercel.json` SPA rewrite is present (client-side routes don't 404 on
      direct load)
- [ ] Visiting `/dashboard` or `/upload` directly (not just via in-app
      navigation) loads correctly
- [ ] No `localhost` URLs appear in the deployed bundle (check Network tab)

## Security

- [ ] Helmet is active (default security headers present — check response
      headers in production)
- [ ] CORS only allows the configured `CLIENT_URL` origin(s), not `*`
- [ ] JSON/urlencoded body size is capped (`1mb`) so large payloads can't
      be used to exhaust memory
- [ ] File uploads are capped at 10 MB and restricted to PDF/DOCX by both
      MIME type and extension
- [ ] Passwords are hashed (bcrypt) and never returned in API responses
      (`select: false` + `toJSON` transform on the User model)
- [ ] Stack traces are hidden from API error responses in production
      (`errorHandler.js` only includes `stack` when `!isProduction`)
- [ ] No secrets (`.env`, API keys, JWT secret) are committed to git —
      confirm with `git log --all --full-history -- backend/.env`
- [ ] `GEMINI_API_KEY` is never sent to or readable by the frontend

## Testing

- [ ] Register → Login → Logout flow works end-to-end in production
- [ ] Upload → Parse → AI Analysis → ATS → JD Match → Rewrite → Interview
      Questions pipeline completes without errors
- [ ] Dashboard reflects the latest report immediately after generation
- [ ] PDF report download produces a valid, readable file
- [ ] Refreshing mid-workflow (Upload page) restores the previous state
- [ ] Invalid file types/oversized files are rejected with a clear message
- [ ] Expired/invalid JWT correctly redirects to login instead of erroring

## Build verification

- [ ] `backend`: `npm install && npm start` — starts cleanly
- [ ] `frontend`: `npm install && npm run build && npm run preview` —
      builds and serves cleanly
- [ ] `frontend`: `npm run lint` — no errors
- [ ] No console errors in the browser on Landing, Login, Register,
      Dashboard, and Upload pages

## Post-deploy

- [ ] Tag the release in git (see suggested commit message in the Step 12
      summary)
- [ ] Confirm Render and Vercel are both tracking the intended branch
- [ ] Spot-check Render logs and Vercel deployment logs for warnings
