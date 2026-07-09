# AI Resume Analyzer

A full-stack SaaS platform that analyzes resumes the way a recruiter and an
Applicant Tracking System (ATS) both would — parsing the document, scoring
it, matching it against a job description, rewriting weak sections, and
generating tailored interview questions, all backed by Google's Gemini API
where AI judgment is needed and deterministic rules everywhere else.

---

## Features

- **Authentication** — JWT-based register/login, protected routes, session
  persistence
- **Resume Upload** — drag-and-drop or click-to-browse, PDF/DOCX only,
  10 MB limit, animated progress
- **Resume Parsing** — deterministic extraction of basic info, sections,
  skills, experience, education, projects, certifications, and metadata
- **AI Resume Analysis** — Gemini-powered structured feedback (strengths,
  weaknesses, suggestions) on the parsed resume
- **ATS Score** — rule-based, explainable scoring against common ATS
  heuristics (no AI involved — fully deterministic and auditable)
- **Job Description Matching** — paste a JD and get a match score, matched
  vs. missing skills, keyword overlap, and recommendations (deterministic)
- **Resume Rewrite** — Gemini-generated improved summary/experience/project
  lines, informed by the analysis, ATS score, and JD match
- **Interview Question Generator** — Gemini-generated technical, project,
  behavioral, and HR questions tailored to the full analysis pipeline
- **Dashboard** — latest report at a glance, quick actions, workflow
  progress, resume health summary
- **Download PDF Report** — exports the full analysis pipeline as a
  shareable PDF

## Architecture

### Backend (Node.js / Express)

```
routes → middleware → controllers (thin only) → services → providers → utils
```

- Controllers contain **no business logic** — they validate the request
  shape and delegate.
- All business logic lives in `services/`, one folder per feature
  (`ai`, `ats`, `jd`, `rewrite`, `interview`, `parser`, `storage`).
- Each service folder exposes a single `index.js` entry point; controllers
  never reach into a service's internal files directly.
- `services/ai/providers/gemini.provider.js` is the **only** file that talks
  to Google's Gemini API directly — every AI-backed feature (Analysis,
  Rewrite, Interview Questions) shares it. Swapping AI providers later means
  adding a new file in `providers/`, not touching the services that use it.
- ATS Engine, JD Matching, and Resume Parsing are **fully deterministic** —
  no Gemini calls, no non-determinism, fully explainable output.

### Frontend (React / TypeScript / Vite)

```
pages → components → services → hooks → types → utils
```

- One type file per feature: `upload.types.ts`, `ai.types.ts`,
  `ats.types.ts`, `jd.types.ts`, `rewrite.types.ts`, `interview.types.ts`,
  `report.types.ts`
- `services/apiClient.ts` centralizes the Axios instance, JWT attachment,
  and 401 handling — feature services build on top of it
- Tailwind CSS for styling, Framer Motion for animation, React Router for
  navigation, jsPDF for the downloadable report

### Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router, Axios, Framer Motion, jsPDF |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs, Multer |
| AI | Google Gemini API (`@google/genai`) |
| Parsing | `pdf-parse`, `mammoth` |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

## Screenshots

> _Add screenshots here before publishing — suggested shots below._

| Landing | Upload | Dashboard |
|---|---|---|
| `docs/screenshots/landing.png` | `docs/screenshots/upload.png` | `docs/screenshots/dashboard.png` |

| AI Analysis | ATS Score | Interview Questions |
|---|---|---|
| `docs/screenshots/analysis.png` | `docs/screenshots/ats.png` | `docs/screenshots/interview.png` |

## Installation

### Prerequisites

- Node.js 18+
- npm
- A MongoDB instance (local, or a free [Atlas](https://www.mongodb.com/atlas) cluster)
- A [Gemini API key](https://aistudio.google.com/apikey)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd ai-resume-analyzer

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

```bash
cd backend && cp .env.example .env
cd ../frontend && cp .env.example .env
```

Edit `backend/.env` — see [Environment Variables](#environment-variables)
below for what each value means.

### 3. Run in development

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Frontend: http://localhost:5173 · Backend: http://localhost:5000/api

### 4. Verify

```bash
curl http://localhost:5000/api/health
# { "success": true, "data": { "message": "API is running" } }
```

## Environment variables

Full reference with inline comments lives in
[`backend/.env.example`](backend/.env.example) and
[`frontend/.env.example`](frontend/.env.example). Summary:

**Backend**

| Variable | Purpose | Example |
|---|---|---|
| `NODE_ENV` | Enables production hardening (hidden stack traces, fail-fast JWT check, trusted proxy) | `production` |
| `PORT` | Server port (Render sets this automatically) | `5000` |
| `CLIENT_URL` | Allowed CORS origin(s), comma-separated | `https://your-app.vercel.app` |
| `MONGODB_URI` | MongoDB connection string | Atlas SRV string |
| `JWT_SECRET` | Signing secret for JWTs — required in production | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `GEMINI_API_KEY` | Google Gemini API key | — |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.5-flash` |
| `GEMINI_TIMEOUT_MS` | Timeout before an AI call is treated as failed | `60000` |

**Frontend**

| Variable | Purpose | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API, including `/api` | `https://your-backend.onrender.com/api` |

Neither `.env` file is committed — both are covered by the root
`.gitignore`. Never commit real secrets.

## Deployment

Full step-by-step instructions (MongoDB Atlas → Gemini → Render → Vercel,
plus CORS wiring and end-to-end verification) are in
[`DEPLOYMENT.md`](DEPLOYMENT.md). A pre/post-deploy checklist is in
[`PRODUCTION_CHECKLIST.md`](PRODUCTION_CHECKLIST.md).

Quick reference:

| Component | Target | Root directory | Build | Start |
|---|---|---|---|---|
| Frontend | Vercel | `frontend` | `npm run build` | (static, `dist/`) |
| Backend | Render | `backend` | `npm install` | `npm start` |
| Database | MongoDB Atlas | — | — | — |

## Future improvements

- Automated test suite (unit + integration) for services and API routes
- Rate limiting on auth and AI-backed endpoints
- Swap local disk storage for S3/Cloudinary (the `services/storage`
  contract already supports this with no controller changes)
- Structured logging (Winston/Pino) in place of the current minimal logger
- Resume version history and comparison across re-uploads
- Multi-language resume parsing and analysis

## License

MIT — see [`LICENSE`](LICENSE).
