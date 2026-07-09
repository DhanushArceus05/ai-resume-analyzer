# Deployment Guide

This guide covers deploying the AI Resume Analyzer to:

- **Frontend** → [Vercel](https://vercel.com)
- **Backend** → [Render](https://render.com)
- **Database** → [MongoDB Atlas](https://www.mongodb.com/atlas)
- **AI provider** → [Google Gemini API](https://ai.google.dev/)

Deploy in this order: **Atlas → Gemini key → Render (backend) → Vercel (frontend)**,
since the frontend needs the backend's live URL, and the backend needs the
database and Gemini credentials.

---

## 1. MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. **Database Access** → add a database user with a strong, generated password.
3. **Network Access** → add an IP allowlist entry. For Render (which uses
   dynamic egress IPs on the free tier), allow `0.0.0.0/0` ("Allow access
   from anywhere") and rely on the database username/password plus TLS for
   protection. If you're on a paid Render plan with static outbound IPs,
   allowlist those specific IPs instead.
4. **Connect** → "Drivers" → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ai-resume-analyzer?retryWrites=true&w=majority
   ```
5. Save this as `MONGODB_URI` for the backend (step 3 below).

## 2. Gemini API key

1. Create a key at [Google AI Studio](https://aistudio.google.com/apikey).
2. Save it as `GEMINI_API_KEY` for the backend.
3. Treat this key like a password — never commit it, never expose it to the
   frontend. All Gemini calls happen server-side through
   `backend/services/ai/providers/gemini.provider.js`.

## 3. Backend → Render

1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Render: **New +** → **Web Service** → connect the repo.
   - If you'd rather not click through settings manually, Render can also
     read `backend/render.yaml` via **New +** → **Blueprint**.
3. Configure:
   | Setting | Value |
   |---|---|
   | Root Directory | `backend` |
   | Runtime | Node |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Health Check Path | `/api/health` |
4. Add environment variables (Render dashboard → **Environment**):

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | your Vercel URL(s), comma-separated if more than one — set after step 4, can be updated later |
   | `MONGODB_URI` | your Atlas connection string from step 1 |
   | `JWT_SECRET` | output of `openssl rand -hex 32` |
   | `JWT_EXPIRES_IN` | `7d` |
   | `GEMINI_API_KEY` | your key from step 2 |
   | `GEMINI_MODEL` | `gemini-2.5-flash` |
   | `GEMINI_TIMEOUT_MS` | `60000` |

   Do **not** set `PORT` — Render injects it automatically, and
   `backend/config/env.js` already reads `process.env.PORT`.
5. Deploy. Confirm it's healthy:
   ```bash
   curl https://your-backend.onrender.com/api/health
   # { "success": true, "data": { "message": "API is running" } }
   ```
6. Note the live URL (`https://your-backend.onrender.com`) — the frontend
   needs it next.

> **Free tier note:** Render's free web services spin down after a period
> of inactivity and take ~30–60s to wake on the next request. The frontend
> will simply see a slow first request, not an error. Upgrade the plan if
> you need to avoid cold starts.

## 4. Frontend → Vercel

1. In Vercel: **Add New** → **Project** → import the same repo.
2. Configure:
   | Setting | Value |
   |---|---|
   | Root Directory | `frontend` |
   | Framework Preset | Vite |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
3. Add environment variable:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://your-backend.onrender.com/api` |
4. Deploy. `frontend/vercel.json` is already included so client-side routes
   (`/dashboard`, `/upload`, etc.) resolve correctly on direct load/refresh
   instead of 404ing.
5. Vercel gives you a production domain (and a unique preview domain per
   PR/branch). Copy the production one.

## 5. Close the loop: update CORS

Go back to Render and update `CLIENT_URL` to the real Vercel domain(s) from
step 4, e.g.:

```
CLIENT_URL=https://your-app.vercel.app
```

For multiple allowed origins (e.g. production + a specific preview URL you
test against), comma-separate them — no code changes needed:

```
CLIENT_URL=https://your-app.vercel.app,https://your-app-git-staging.vercel.app
```

Redeploy the backend (or let Render auto-restart on env var save) so the
new CORS origin(s) take effect.

## 6. Verify end-to-end

1. Open the Vercel URL, register a new account, log in.
2. Upload a resume (PDF or DOCX) and confirm parsing succeeds.
3. Run AI Analysis, ATS Score, JD Matching, Rewrite, and Interview
   Questions in sequence — each depends on the previous step's output.
4. Download the PDF report from the Dashboard.
5. Refresh the Upload page mid-workflow and confirm it restores state.

---

## Local production build check (before deploying)

```bash
# Backend
cd backend
npm install
npm start                     # verify it boots with a real .env

# Frontend
cd frontend
npm install
npm run build                 # produces frontend/dist
npm run preview               # serve the production build locally
```

## Environment variable reference

See [`backend/.env.example`](backend/.env.example) and
[`frontend/.env.example`](frontend/.env.example) for the full list with
inline comments. Never commit a real `.env` file — both are already
git-ignored at the repo root.
