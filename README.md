# Outreach AI 🚀

A lean, modular, high-impact internal email outreach and hot-lead triage platform. Outreach AI automates the workflow of uploading targeted business lead lists, generating context-aware personalized drafts using modern AI models, sending sequence emails with built-in open-tracking pixels, and running background pollers to sync IMAP inboxes for reply tracking.

---

## 📋 Features

- **Lead Ingestion**: Upload lead spreadsheets (CSV/Google Sheets). Features fuzzy header mapping (e.g., auto-maps `first_name`, `first`, or `firstname` to standard schema headers) and case-insensitive email deduplication.
- **Auto-Detection**: Infers business sectors and geographical locations from leads automatically to seed campaign metadata.
- **Factory AI Provider Pipeline**: Multi-provider email generator supporting **Gemini** (using the new official `@google/genai` SDK), **OpenAI**, **Anthropic/Claude**, and **Groq**.
- **Strategy & Prompt Manager**: Customize outreach tone, CTAs, personas, and system prompts. Includes side-by-side prompt tuning and testing on mock data.
- **Sending Engine**: Standardized sending via custom SMTP servers using Nodemailer. Transporters are pooled and cached dynamically (30-minute eviction) to prevent overhead.
- **Engagement & Open Tracking**: Inject 1x1 transparent tracking pixels into email bodies. Track open counts and timestamp events in real time.
- **IMAP Reply Polling**: A cron-scheduled worker periodically checks IMAP inboxes, matches incoming threads using `In-Reply-To` headers or subjects, logs replies to lead records, and automatically flags qualified leads as **Hot**.
- **Interactive Hot-Lead Workspace**: View live email conversation history, trigger AI-assisted contextual replies, edit drafts, and reply manually directly from the dashboard.
- **Premium Dark HUD Theme**: Cyberpunk-style dark mode theme styled with Tailwind CSS (v4) variables, mesh gradients, status dots, and glassmorphism layouts.

---

## 📁 Repository Structure

```
├── api/                     # FastAPI Backend service
│   ├── app/
│   │   ├── main.py          # CORS setup, health check, and endpoint mocks
│   └── requirements.txt     # Python packages list
│
├── web/                     # Next.js 14 Frontend client & background workers
│   ├── prisma/
│   │   ├── schema.prisma    # Core database models (User, Campaign, Lead, etc.)
│   ├── src/
│   │   ├── app/             # App Router views & API endpoints
│   │   ├── components/      # Shared components (Stepper, Shell, etc.)
│   │   ├── inngest/         # Inngest Serverless queues & background cron tasks
│   │   ├── lib/             # Auth, DB client, logger, and rate-limit managers
│   │   └── modules/         # Main business logic packages (AI, Mail, SMTP, etc.)
│   ├── package.json
│   └── tsconfig.json
│
├── ARCHITECTURE.md          # Architectural decisions & database diagram
└── README.md                # This manual
```

---

## 🛠️ Tech Stack & Prereqs

- **Frontend/API Core**: [Next.js 14](https://nextjs.org/) (App Router) + TypeScript + [Prisma ORM](https://www.prisma.io/)
- **Styling**: Vanilla CSS Variables + Tailwind CSS (v4) + Lucide Icons
- **Job Orchestration**: [Inngest](https://www.inngest.com/) (Runs background queues, cron triggers, and delay states)
- **AI Integrations**: Google Gen AI, OpenAI SDK, Anthropic SDK
- **Email Processing**: Nodemailer (SMTP sending) & Imapflow (IMAP parsing)
- **Local Dev Database**: SQLite (for development) or PostgreSQL

### Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** v18.18+ or v20+
- **pnpm** (preferred package manager)
- **Python** 3.11+
- **Docker** (optional, to run PostgreSQL locally)

---

## ⚙️ Configuration & Environment

Create a `.env` or `.env.local` file inside the `web/` folder:

```env
# Database Connections
DATABASE_URL="file:./dev.db" # Or postgresql://user:pass@localhost:5432/dbname

# NextAuth Config (Use openssl rand -base64 32 to generate)
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"

# Encryption Key (Used for encrypting SMTP passwords at rest)
ENCRYPTION_KEY="outreach-ai-secure..."

# Optional AI API Keys (Configure in global web settings or here)
GEMINI_API_KEY="AIzaSy..."
OPENAI_API_KEY="sk-..."
CLAUDE_API_KEY="sk-ant-..."
GROQ_API_KEY="gsk_..."
```

---

## 🚀 Getting Started

### 1. Setup and Run the Database

Navigate to the `web/` folder and run the Prisma migrations:
```bash
cd web
pnpm install
pnpm prisma db push
```

*(Optional)* Seed initial data or verify database schema with Prisma Studio:
```bash
pnpm prisma studio
```

### 2. Start the Frontend Dev Server

Launch Next.js:
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

### 3. Start the Inngest Dev Server

To process background batches (sending emails, generating drafts, and IMAP checking), run the Inngest local dev server:
```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```
Open the Inngest dev console at [http://localhost:8288](http://localhost:8288) to monitor background runs.

### 4. Setup and Run the FastAPI Backend

In a separate terminal, set up the FastAPI environment:
```bash
cd api
python -m venv .venv

# Activate Virtual Environment (Windows)
.venv\Scripts\activate
# Activate Virtual Environment (macOS/Linux)
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
FastAPI runs on [http://localhost:8000/health](http://localhost:8000/health).

---

## 📦 Production Deployment

1. **Build the Next.js Client**:
   ```bash
   cd web
   pnpm build
   pnpm start
   ```
2. **Postgres & Production Containers**:
   Deploy Postgres and database workers using Docker:
   ```bash
   docker compose up -d
   ```
3. **Queue Config**: Connect the webhook listener in your Inngest Cloud Dashboard pointing to your server's `/api/inngest` endpoint.
