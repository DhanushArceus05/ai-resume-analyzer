# Premium Release Checklist (Phase 5)

This is the final pass before showing this project to the world — as a
live deployment, a GitHub repo, or a portfolio/LinkedIn post. For the
technical deploy steps (env vars, hosting config, security headers),
see `PRODUCTION_CHECKLIST.md` — this file only covers what that one
doesn't.

## Local testing (do this first)

- [ ] `backend`: `npm run lint` — no errors
- [ ] `backend`: `npm run dev` — boots cleanly against a local `.env`
- [ ] `frontend`: `npm run lint` — no errors
- [ ] `frontend`: `npm run build` — completes with no TypeScript errors
- [ ] Full workflow works locally end-to-end: Upload → Parse → AI
      Analysis → ATS → JD Match → Rewrite → Interview Questions →
      Dashboard → PDF download
- [ ] Resume Rewrite: try a resume with already well-written bullet
      points and confirm at least one line is labeled "Already Strong"
      instead of silently looking unchanged
- [ ] Every empty/error/loading state has been seen at least once
      (easiest way: throttle network in devtools, or briefly rename
      `GEMINI_API_KEY` to trigger the error states)

## GitHub readiness

- [ ] `README.md` accurately describes what the app does and how to run
      it locally (no stale setup steps)
- [ ] `.env.example` lists every env var the app actually reads — no
      more, no less
- [ ] No committed secrets: `git log --all --full-history -- backend/.env`
      comes back empty
- [ ] `.gitignore` excludes `node_modules`, `.env`, `dist`, `uploads`,
      logs
- [ ] Repo has a clear license (`LICENSE` is present)
- [ ] Commit history doesn't have embarrassing WIP messages on `main`
      (squash if needed)

## Deployment readiness

- [ ] Everything in `PRODUCTION_CHECKLIST.md` is checked off
- [ ] A fresh visitor (no cache, private window) can complete the full
      workflow on the deployed URL without errors

## Portfolio showcase

- [ ] Take fresh screenshots/recording of: Landing page, Upload flow,
      ATS score, JD match, Rewrite comparison (showing an "Already
      Strong" label), Dashboard, and the downloaded PDF report
- [ ] Write 2–3 sentences on the problem this project solves — this is
      what goes above the fold on a portfolio page
- [ ] List the real architecture (routes → middleware → controllers →
      services → providers, Gemini as the AI provider) as a talking
      point — it's a legitimate design decision worth explaining in an
      interview, not just boilerplate

## LinkedIn post readiness

- [ ] One paragraph: what the project is and who it's for
- [ ] One paragraph: one interesting technical decision (e.g. the
      rewrite quality gate that flags near-identical AI output instead
      of pretending it always works) — specifics read as more credible
      than "built with React and Node"
- [ ] Link to the live demo AND the GitHub repo
- [ ] Screenshot or short screen recording attached (posts with visuals
      get meaningfully more engagement)
- [ ] Proofread for typos — read it out loud once before posting
