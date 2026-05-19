# AI PPT Generator

An AI-powered web app that generates complete, professional 9-slide academic PowerPoint presentations from any topic input, suitable for B.Tech and engineering seminars.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/ppt-generator run dev` — run the frontend (port 19362)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL` — Replit AI proxy URL
- Required env: `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI proxy key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + shadcn/ui
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: Replit OpenAI Integration (gpt-5.4)
- PPT: PptxGenJS
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/db/src/schema/presentations.ts` — Presentations DB schema
- `artifacts/api-server/src/routes/presentations.ts` — All presentation API routes
- `artifacts/ppt-generator/src/` — React frontend
- `data/pptx/` — Generated PPTX files stored here

## Architecture decisions

- AI content generation uses Replit's OpenAI proxy (gpt-5.4) instead of Ollama, which is not available in this environment
- PPTX files are stored on disk in `data/pptx/` keyed by UUID; DB stores the file path
- The `/api/presentations/stats` route is registered before `/:id` to avoid route shadowing
- The download endpoint streams the PPTX file directly with the right Content-Disposition header; the frontend uses a plain `<a href>` tag rather than a fetch hook
- PPTX generation uses a dark navy + electric blue theme for professional visual quality

## Product

- Users enter any academic topic and get a fully AI-written 9-slide presentation
- Fixed slide structure: Title → Introduction → Main Concept → Technical Explanation → Advantages → Disadvantages → Limitations → Conclusion → Thank You
- Generated PPTX files are downloadable and deletable
- Stats panel shows total presentations generated and average generation time

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change
- Run `pnpm --filter @workspace/db run push` after schema changes
- The `data/pptx/` directory is created automatically at server startup

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
