# Dooz PM Suite

> AI-Era Project Management Control Plane

**Human-in-the-loop intent management, decision tracking, and organizational memory.**

---

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Server runs at http://localhost:3000
```

---

## Architecture

```
dooz-pm-suite/
├── src/
│   ├── index.ts          # Hono server entry
│   ├── db/
│   │   ├── schema.ts     # Drizzle ORM schema (PostgreSQL/SQLite)
│   │   └── index.ts      # Database connection
│   ├── services/
│   │   ├── intent.service.ts   # Intent CRUD + state machine
│   │   └── decision.service.ts # Append-only decision ledger
│   ├── routes/
│   │   ├── intents.ts    # /api/intents
│   │   ├── decisions.ts  # /api/decisions
│   │   ├── ingestion.ts  # /api/ingestion (AI extraction)
│   │   └── graph.ts      # /api/graph (knowledge graph)
│   └── lib/
│       └── types.ts      # Zod schemas
└── ui/                   # React frontend (Phase 2)
```

---

## Core Concepts

### Intents
Primary artifacts capturing human purpose. Every artifact must belong to an Intent.

**State Machine:**
```
research → planning → execution → archived
    ↑__________|          |
                 ↑________|
```

### Decisions (Append-Only Ledger)
Committed human judgments. Immutable after commit - can only be superseded.

### AI Proposals
AI can **propose** decisions, assumptions, and risks. Humans must **accept/reject/park**.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/intents` | List intents |
| POST | `/api/intents` | Create intent |
| POST | `/api/intents/:id/transition` | Change state |
| GET | `/api/decisions/intent/:id` | Decision ledger |
| POST | `/api/decisions` | Commit decision |
| POST | `/api/ingestion` | Upload for AI extraction |
| GET | `/api/ingestion/proposals` | Pending AI proposals |

---

## Database

- **Production**: PostgreSQL
- **Development**: SQLite

```bash
# Generate migrations
bun run db:generate

# Apply migrations
bun run db:migrate
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/pm_suite

# AI Router (coming soon)
OPENROUTER_API_KEY=sk-...
OLLAMA_BASE_URL=http://localhost:11434
```

---

## Design Principles

1. **AI is advisory only** - Never autonomous
2. **Intent-first modeling** - Tasks are secondary
3. **Append-only memory** - Decisions are immutable
4. **Explicit human transitions** - No silent state changes

---

## License

MIT © DoozieSoft
