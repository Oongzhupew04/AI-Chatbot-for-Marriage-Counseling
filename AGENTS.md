# AGENTS.md — AI Chatbot for Marriage Counseling

## Project Overview

This is an enterprise-grade, AI-driven marriage counseling platform built with a **microservices architecture** and fully containerized with Docker. It provides secure, intelligent counseling via LLMs with RAG, real-time risk detection, AES-256 encryption, PII masking, and omnichannel notifications.

**This project handles sensitive mental health data. Security, privacy, and safety are non-negotiable.**

---

## Architecture & Services

The system is composed of **four services** that communicate over Docker networking:

| # | Service | Directory | Tech Stack | Port |
|---|---------|-----------|------------|------|
| 1 | **Frontend (Web)** | `1-frontend-react/` | React 18, Vite, TypeScript, Zustand, TanStack React Query | 5173 |
| 2 | **Frontend (Mobile)** | `1-frontend-mobile/` | React Native, Expo SDK 54, TypeScript | Expo Dev |
| 3 | **API Gateway** | `2-gateway-node/` | Node.js, Express, TypeScript, JWT, Multer, Winston | 3000 |
| 4 | **AI Backend** | `3-ai-service-python/` | Python, FastAPI, LangChain, HuggingFace, SpaCy | 8000 |
| 5 | **Database** | `custom_db/` | openGauss (PostgreSQL) + DataVec vector extension | 5432 |

### Request Flow

```
User → Frontend (React/Expo) → API Gateway (Express + JWT) → AI Service (FastAPI) → openGauss DB
```

- The **API Gateway** is the single point of entry. It handles JWT authentication, rate limiting, file uploads, and proxies requests to the Python AI Service.
- The **AI Service** is an internal-only microservice. It is NEVER exposed directly to users.
- The **Frontend** communicates exclusively with the Gateway via Axios (`localhost:3000` in dev).

---

## Tech Stack & Conventions

### 1. Frontend — React Web (`1-frontend-react/`)

- **Framework**: React 18 + Vite + TypeScript
- **State Management**: Zustand (client state in `src/store/`) + TanStack React Query (server state in `src/hooks/`)
- **Routing**: React Router DOM v6
- **Styling**: CSS Modules (`*.module.css` co-located with components/pages)
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library
- **File structure**:
  - `src/pages/` — Page-level components (one per route), each with a co-located `.module.css`
  - `src/pages/admin/` — Admin-only pages
  - `src/pages/auth/` — Authentication pages (Login, Register, ForgotPassword, ResetPassword)
  - `src/components/` — Reusable components with co-located CSS modules
  - `src/components/modals/` — Modal dialog components
  - `src/store/` — Zustand stores
  - `src/hooks/` — Custom React hooks (React Query wrappers)

**Conventions**:
- Use **PascalCase** for component filenames (e.g., `Home.tsx`, `Sidebar.tsx`)
- Use **camelCase** for hook/store filenames (e.g., `useChat.ts`, `chatStore.ts`)
- Always co-locate CSS modules with their component: `ComponentName.module.css`
- Use **CSS Modules** — never global CSS classes (except in `index.css` for base resets)
- JWT tokens are stored in `localStorage` under the key `'token'`
- Section separators use the `// ==================` comment banner style

### 2. Frontend — React Native Mobile (`1-frontend-mobile/`)

- **Framework**: React Native + Expo SDK 54 (Expo Router, file-based routing)
- **Language**: TypeScript
- **Architecture**: `app/` directory for routes, `components/`, `hooks/`, `constants/`, `context/`
- **Testing**: Jest
- **CRITICAL**: Expo APIs change frequently. **Always read the exact versioned docs at `https://docs.expo.dev/versions/v54.0.0/` before writing any Expo code.**

### 3. API Gateway (`2-gateway-node/`)

- **Framework**: Express 4 + TypeScript
- **Auth**: JWT (`jsonwebtoken`) — `JWT_SECRET` env var is **required** or the server exits
- **Rate Limiting**: `express-rate-limit` — global (100 req/15 min) + chat-specific (10 req/min)
- **File Uploads**: Multer — profile pics go to `uploads/profiles/`, resources to `uploads/resources/`
- **Logging**: Winston (`src/utils/logger.ts`) + Morgan (request logging)
- **Testing**: Jest + Supertest
- **The gateway is a single file**: `src/server.ts` — all routes are defined here
- **The gateway proxies all business logic to the Python AI Service** at `PYTHON_SERVICE_URL`

**Conventions**:
- The gateway should contain **zero business logic** — it only validates JWTs, proxies requests, and handles file uploads
- Always use the Winston logger, never raw `console.log` in production code
- All API responses should use consistent JSON structure: `{ data: ... }` or `{ error: "..." }`

### 4. AI Backend (`3-ai-service-python/`)

- **Framework**: FastAPI + Uvicorn
- **Language**: Python 3
- **Architecture**: Layered (Service → Repository → Database)
  - `main.py` — FastAPI app, route definitions, Pydantic request/response models
  - `services/` — Business logic layer (auth, chat, checkin, email, notification, risk alerts, feedback)
  - `repositories/` — Data access layer (raw SQL via JDBC cursor)
  - `models/` — Pydantic data models
  - `utils/` — Utilities (logger)
  - `scripts/` — One-off scripts
  - `tests/` — Pytest test files
- **Database**: openGauss via JayDeBeAPI (JDBC) — `database.py` exports a global singleton `db`
- **RAG Pipeline**: LangChain + `BAAI/bge-large-en-v1.5` embeddings → openGauss DataVec for vector search
- **LLM**: Groq API with `llama-3.3-70b-versatile`
- **Risk Detection**: Dual-layer — regex keyword matching + HuggingFace semantic similarity (cosine)
- **PII Masking**: SpaCy NLP + regex patterns
- **Encryption**: AES-256 for message storage (via `cryptography` library)
- **Notifications**: Expo Push (mobile), Web Push (`pywebpush`), SMTP email (`smtplib`)
- **Scheduling**: APScheduler for daily cron jobs (partner check-ins)
- **Testing**: Pytest

**Conventions**:
- Use **snake_case** for all Python filenames, functions, and variables
- Pydantic models for request/response validation are defined in `main.py` alongside the routes
- Repository methods use raw SQL with parameterized queries (`?` placeholders for JayDeBeAPI)
- **Always use the DatabaseSingleton** (`from database import db`) — never create new connections
- Auto-commit is OFF — repositories must explicitly commit transactions: `db.get_connection().commit()`
- Use the custom logger: `from utils.logger import logger`
- Section separators use the `# ==================` comment banner style

---

## Database

- **Engine**: openGauss (PostgreSQL-compatible) with DataVec extension for vector storage
- **Schema**: Defined in `custom_db/init_db.sql` — auto-runs on first container startup
- **Connection**: JayDeBeAPI (JDBC) via `opengauss-jdbc-6.0.3.jar`
- **Key tables**: `users`, `chats`, `messages`, `resources`, `faqs`, `feedback`, `risk_alerts`, `checkins`, `push_subscriptions`
- **User**: `ogc` / Database: `ad1`

**Rules**:
- Never modify `init_db.sql` without understanding the full schema — it only runs on first container startup
- For schema changes, prefer writing migration SQL scripts rather than editing `init_db.sql`
- Password column uses `werkzeug.security` hashing — never store plaintext passwords
- Messages are AES-256 encrypted at rest

---

## Security Rules (CRITICAL)

1. **Never commit `.env` files** — use `.env.example` for templates
2. **Never log or expose**: API keys, JWT secrets, database passwords, user messages (they contain sensitive counseling data), AES encryption keys
3. **Never bypass the API Gateway** — all client requests must go through the Express gateway for JWT validation
4. **Never disable rate limiting** — it protects the LLM endpoint from abuse
5. **Always parameterize SQL queries** — no string concatenation/interpolation in SQL
6. **Always validate input** with Pydantic models on the Python side
7. **Always encrypt messages** before storing them in the database
8. **Never expose the Python AI Service directly** — it is an internal microservice
9. **PII masking must run before LLM processing** — user data should never reach the LLM unmasked
10. **Risk detection must run before every AI response** — this is a safety-critical feature for detecting abuse and self-harm

---

## Environment Variables

All secrets are managed via `.env` at the project root (see `.env.example` for the template):

| Variable | Used By | Purpose |
|----------|---------|---------|
| `DB_PASSWORD` | AI Service, Database | openGauss user password |
| `GROQ_API_KEY` | AI Service | LLM API access |
| `HF_TOKEN` | AI Service | HuggingFace model access |
| `SMTP_USER` | AI Service | Email notification sender |
| `SMTP_PASS` | AI Service | Gmail app password |
| `AES_ENCRYPTION_KEY` | AI Service | 32-byte Base64 key for message encryption |
| `JWT_SECRET` | Gateway | JWT signing secret (auto-generated or manually set) |

---

## Development Workflow

### Running Locally (Full Stack)

```bash
# Start all services with Docker
docker-compose up --build
```

- Frontend: `http://localhost:5173`
- Gateway: `http://localhost:3000`
- AI Service (Swagger): `http://localhost:8000/docs`

### Running Individual Services (Without Docker)

```bash
# Frontend
cd 1-frontend-react && npm run dev

# Gateway
cd 2-gateway-node && npx ts-node src/server.ts

# AI Service
cd 3-ai-service-python && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Mobile
cd 1-frontend-mobile && npx expo start
```

### Running Tests

```bash
# Frontend (Vitest)
cd 1-frontend-react && npm test

# Gateway (Jest)
cd 2-gateway-node && npm test

# AI Service (Pytest)
cd 3-ai-service-python && pytest
```

---

## Code Style & Patterns

### General
- Use clear, descriptive section banners (`// =======` or `# =======`) to separate major code sections
- Preserve all existing comments and docstrings when editing code
- Keep error handling consistent: catch exceptions, log them, and return appropriate HTTP status codes
- Use TypeScript strict mode in all TS projects

### When Adding New Features
1. **New API endpoint**: Add route in `main.py` → create/update service in `services/` → create/update repo in `repositories/` → proxy through gateway in `server.ts`
2. **New frontend page**: Create `PageName.tsx` + `PageName.module.css` in `src/pages/` → add route in `App.tsx`
3. **New mobile screen**: Create file in `app/` directory (Expo Router file-based routing)
4. **New database table**: Add to `custom_db/init_db.sql` for fresh installs + write a migration script for existing deployments

### Do NOT
- Install new dependencies without explicit approval
- Change the database connection pattern (singleton via JayDeBeAPI)
- Modify Docker networking or port mappings without understanding the full compose topology
- Use ORMs — this project uses raw SQL by design for openGauss compatibility
- Skip Pydantic validation on new API endpoints
