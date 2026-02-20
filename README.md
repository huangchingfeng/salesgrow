# SalesGrow

AI-powered growth platform for global sales professionals. Research prospects, craft outreach emails, practice sales scenarios with AI coaching, and track your progress with gamification.

## Features

### Core Modules
- **Client Research** - AI-powered company research with pain points, icebreakers, and key contacts
- **Smart Outreach** - Generate personalized emails with AI scoring (4 dimensions, 100-point scale)
- **Visit Log** - Record and transcribe client meetings with AI summaries
- **Follow-Up Engine** - Smart follow-up reminders with AI-drafted messages
- **AI Sales Coach** - Practice 30+ sales scenarios with role-play AI
- **Leaderboard** - Gamified progress tracking with XP, levels, streaks, and achievements

### AI System
- Multi-model gateway (DeepSeek, Gemini, Claude) with automatic fallback
- Smart routing: free users get cost-effective models, pro users get premium models
- Built-in quota management, response caching, and cost tracking

### Internationalization
9 languages: English, Traditional Chinese, Japanese, Korean, Thai, Vietnamese, German, French, Spanish

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Supabase Auth |
| API | tRPC v11 |
| State | Zustand + React Query |
| AI | DeepSeek / Gemini / Claude |
| i18n | next-intl |
| Testing | Vitest + Playwright |
| Deployment | Vercel |

## Quick Start

### Prerequisites
- Node.js 22+
- PostgreSQL (or use Docker)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd salesgrow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Using Docker

```bash
docker compose up -d
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Database
DATABASE_URL=

# AI API Keys
DEEPSEEK_API_KEY=
GOOGLE_AI_API_KEY=
ANTHROPIC_API_KEY=
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── [locale]/           # Locale-based routing (9 languages)
│   │   ├── dashboard/      # Main dashboard
│   │   ├── research/       # Client research
│   │   ├── outreach/       # Email outreach
│   │   ├── visit-log/      # Visit logging
│   │   ├── follow-up/      # Follow-up management
│   │   ├── coach/          # AI sales coach
│   │   ├── leaderboard/    # Gamification
│   │   └── settings/       # User settings
│   └── api/trpc/           # tRPC API handler
├── components/             # React components
│   ├── ui/                 # Base UI components
│   ├── layout/             # Layout components
│   ├── modules/            # Feature modules
│   └── gamification/       # Gamification components
├── lib/
│   ├── ai/                 # AI gateway, models, prompts, types
│   ├── db/                 # Database schema and connection
│   ├── utils.ts            # Utility functions
│   └── auth.ts             # Authentication helpers
├── server/
│   ├── trpc.ts             # tRPC setup
│   ├── root.ts             # Root router
│   └── routers/            # API routers
├── i18n/                   # Internationalization config
└── middleware.ts            # Next.js middleware
messages/                   # Translation files (9 locales)
tests/
├── unit/                   # Vitest unit tests
├── integration/            # Integration tests
└── e2e/                    # Playwright E2E tests
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |
| `npm run test:unit` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Drizzle Studio |

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to `main`

Multi-region deployment configured: Tokyo (hnd1), Seoul (icn1), San Francisco (sfo1), Frankfurt (fra1), Singapore (sin1)

### Docker

```bash
# Development
docker compose up -d

# Access the app
open http://localhost:3000
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Run tests (`npm run test:unit`)
4. Commit changes (`git commit -m "Add my feature"`)
5. Push and create a Pull Request

## License

MIT
