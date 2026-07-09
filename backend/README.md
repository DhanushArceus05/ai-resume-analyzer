# AI Resume Analyzer - Backend

Backend API for the **AI Resume Analyzer** built with **Node.js, Express.js, MongoDB Atlas, JWT Authentication, and Google Gemini AI**.

The backend provides secure authentication, resume parsing, AI-powered analysis, ATS scoring, job description matching, resume rewriting, interview question generation, and PDF report support.

---

# Features

- JWT Authentication
- User Registration & Login
- Resume Upload (PDF & DOCX)
- Resume Parsing
- AI Resume Analysis
- ATS Score Generation
- Job Description Matching
- AI Resume Rewrite
- AI Interview Question Generation
- Dashboard APIs
- Secure User Data Isolation
- MongoDB Atlas Integration
- Google Gemini AI Integration

---

# Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- Google Gemini AI
- Multer
- Mammoth
- pdf-parse

---

# Installation

```bash
npm install
```

---

# Environment Variables

Create a `.env` file using `.env.example`.

Required variables:

```env
NODE_ENV=development

PORT=5000

CLIENT_URL=http://localhost:5173

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

JWT_EXPIRES_IN=7d

GEMINI_API_KEY=your_gemini_api_key

GEMINI_MODEL=gemini-2.5-flash

GEMINI_TIMEOUT_MS=60000
```

---

# Run Development Server

```bash
npm run dev
```

---

# Production

```bash
npm start
```

---

# Project Structure

```
backend
│
├── src
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── providers
│   ├── routes
│   ├── services
│   ├── utils
│   └── server.js
│
├── scripts
├── package.json
└── .env.example
```

---

# API

The backend is consumed by the React frontend.

Example:

```
POST /api/auth/register

POST /api/auth/login

POST /api/upload

POST /api/analyze

POST /api/ats

POST /api/jd-match

POST /api/rewrite

POST /api/interview
```

---

# Deployment

- Backend: Render
- Database: MongoDB Atlas
- AI Provider: Google Gemini AI

---

# License

MIT License