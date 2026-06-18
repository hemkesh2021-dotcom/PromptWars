# 🗳️ Election Guide India

> AI-powered, non-partisan assistant for understanding India's election process — built with Google Gemini, Cloud Translation, and Custom Search APIs.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-Run-4285F4?logo=googlecloud&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-8E75B2?logo=googlegemini&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-62_passing-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🎯 Problem Statement

India has **970M+ eligible voters**, many of whom — especially first-time voters — lack clarity on voter registration, election timelines, and polling day procedures. Misinformation and complexity discourage participation.

**Election Guide India** solves this by providing a conversational AI assistant that explains the election process in a clear, neutral, step-by-step manner across 10+ Indian languages.

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **Smart AI Conversation** | Google Gemini-powered multi-turn chat with election-specific system instructions |
| 🌐 **10 Indian Languages** | Real-time translation via Google Cloud Translation API |
| 🔍 **Live Election Info** | Real-time search from official sources via Custom Search API |
| ⚖️ **Strict Neutrality** | AI is constrained to never recommend parties or candidates |
| 📱 **Responsive UI** | Glassmorphic dark theme, accessible on all devices |
| 🛡️ **Production Security** | Helmet, rate limiting, XSS sanitization, CSP headers |
| 🧪 **62 Automated Tests** | Unit, integration, and security test suites |
| 🐳 **Containerized** | Multi-stage Dockerfile, Cloud Run ready |

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (Client)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ index.html│  │ app.js   │  │styles.css│  │knowledge │ │
│  │          │  │BackendCli│  │          │  │   .js    │ │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └────┬─────┘ │
│       │              │                           │       │
│       │         API Calls                   Offline      │
│       │         (fetch)                     Fallback     │
└───────┼──────────────┼───────────────────────────┘───────┘
        │              │
        │     ┌────────▼────────┐
        │     │  Express Server  │
        │     │   (server.js)    │
        │     ├─────────────────┤
        │     │ • /api/chat     │──► Google Gemini API (4-model fallback)
        │     │ • /api/translate│──► Google Cloud Translation API v2
        │     │ • /api/search   │──► Google Custom Search API
        │     │ • /api/models   │──► Service registry
        │     │ • /health       │──► Cloud Run health probes
        │     ├─────────────────┤
        │     │ Security Layer  │
        │     │ • Helmet CSP    │
        │     │ • Rate Limiter  │
        │     │ • Input Limits  │
        │     └─────────────────┘
        │              │
        │     ┌────────▼────────┐
        │     │  Google Cloud    │
        │     │ ┌──────────────┐│
        │     │ │  Cloud Run   ││
        │     │ │  Cloud Build ││
        │     │ │  Secret Mgr  ││
        │     │ │  Artifact Reg││
        │     │ │  Cloud Log   ││
        │     │ └──────────────┘│
        │     └─────────────────┘
```

## 🔌 Google Services Integration

| # | Service | Purpose | Status |
|---|---------|---------|--------|
| 1 | **Google Gemini API** | AI conversation with 4-model fallback chain | ✅ Active |
| 2 | **Cloud Translation API v2** | Multi-language support (10 Indian languages) with LRU caching | ✅ Active |
| 3 | **Custom Search API** | Real-time election info from eci.gov.in | ⚙️ Configurable |
| 4 | **Google Cloud Run** | Serverless container deployment with auto-scaling | ✅ Configured |
| 5 | **Google Cloud Build** | CI/CD pipeline (test → build → deploy on push) | ✅ Configured |
| 6 | **Google Cloud Logging** | Structured JSON logging for monitoring | ✅ Active |
| 7 | **Google Secret Manager** | Secure API key injection (no plaintext env vars) | ✅ Configured |
| 8 | **Google Artifact Registry** | Docker image versioning and storage | ✅ Configured |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Google API key with Gemini API enabled ([Get one here](https://aistudio.google.com/apikey))

### Local Development

```bash
# Clone
git clone https://github.com/hemkesh2021-dotcom/election-guide-india.git
cd election-guide-india

# Configure
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY

# Install & Run
npm install
npm start
# → http://localhost:8080
```

### Run Tests

```bash
npm test              # All 62 tests
npm run test:unit     # Unit tests only (no server needed)
npm run test:api      # API integration tests (start server first)
```

## 🐳 Docker

```bash
# Build
docker build -t election-guide .

# Run
docker run -p 8080:8080 -e GOOGLE_API_KEY=your-key election-guide
```

## ☁️ Deploy to Google Cloud Run

```bash
# One-command deploy (builds from source)
gcloud run deploy election-guide \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-secrets "GOOGLE_API_KEY=gemini-api-key:latest" \
  --port 8080

# Or use Cloud Build CI/CD
gcloud builds submit --config cloudbuild.yaml
```

## 📁 Project Structure

```
election-guide-india/
├── server.js              # Express backend — API routes, Gemini integration
├── package.json           # Dependencies and scripts
├── vitest.config.js       # Test configuration
├── cloudbuild.yaml        # Google Cloud Build CI/CD pipeline
├── Dockerfile             # Multi-stage, Alpine, non-root production image
├── .dockerignore          # Lean Docker context
├── .env.example           # Environment variable template
├── .gitignore             # Comprehensive exclusion rules
├── public/                # Frontend (served as static files)
│   ├── index.html         # Semantic HTML with accessibility features
│   ├── app.js             # Chat UI, BackendClient, MatchingEngine
│   ├── styles.css         # Glassmorphic dark theme, responsive design
│   └── knowledge.js       # Neutral election knowledge base (12 topics)
└── tests/                 # Test suites
    ├── matching.test.js   # Knowledge base & keyword matching (23 tests)
    ├── security.test.js   # XSS prevention & input validation (21 tests)
    └── api.test.js        # API endpoint integration tests (18 tests)
```

## 🧪 Test Coverage

| Suite | Tests | What It Covers |
|-------|-------|----------------|
| **matching.test.js** | 23 | Knowledge structure, keyword matching, case insensitivity, fallback, edge cases, bias neutrality |
| **security.test.js** | 21 | XSS tag stripping, event handler removal, javascript: URL blocking, input validation, API key exposure scanning |
| **api.test.js** | 18 | Health check, chat endpoint, translation, search, static file serving, security headers (CSP, X-Frame, X-Content-Type) |

## 🛡️ Security

- **API keys** — Server-side only via `process.env`, never in frontend
- **Helmet** — CSP, X-Frame-Options, X-Content-Type-Options
- **Rate limiting** — 30 req/min per IP on all API routes
- **Input sanitization** — HTML tag stripping, event handler removal
- **Payload limits** — 10KB max request body, 2000 char message cap
- **Non-root Docker** — Container runs as `appuser`, not root
- **Secret Manager** — API keys injected from GCP Secret Manager in production

## ♿ Accessibility

- WCAG 2.1 AA compliant
- `aria-live` regions for dynamic chat updates
- Skip navigation link
- Focus-visible indicators on all interactive elements
- Semantic HTML5 structure
- Color contrast ratios exceeding 4.5:1
- Keyboard-navigable interface

## 📄 License

MIT — Built for [Google PromptWars](https://promptwars.google) challenge.
