
## AI Workplace Productivity Assistant — Build Plan

A single-user demo SaaS dashboard with 5 AI-powered tools, real usage stats, and a persistent chatbot. Built on TanStack Start + Lovable Cloud + Lovable AI Gateway.

### Pages & Routes

```
/                   Dashboard (stats + quick actions)
/email              Smart Email Generator
/summarize          Meeting Notes Summarizer
/planner            AI Task Planner
/research           AI Research Assistant
/chat               AI Chatbot
/settings           Settings (theme, clear data)
```

Persistent sidebar layout via `__root.tsx` using shadcn Sidebar.

### Backend (Lovable Cloud)

Tables (single shared workspace — no auth):
- `generations` — `id, kind ('email'|'summary'|'plan'|'research'), created_at` — drives real dashboard counters
- `chat_messages` — `id, role ('user'|'assistant'), content, created_at` — one ongoing conversation

Both tables public-readable/writable for demo (RLS open).

### AI Integration

Lovable AI Gateway via `google/gemini-3-flash-preview`.
- Server route `/api/chat` — streaming chat with `useChat` + AI Elements
- Server fns for one-shot generations: `generateEmail`, `summarizeNotes`, `planTasks`, `researchTopic` (each logs to `generations`)

### UI

- shadcn Sidebar with nav items + icon collapse
- Dashboard: 4 stat cards (live counts via TanStack Query), quick-action buttons
- Each tool page: input form on left, AI output card on right with **Edit / Copy / Regenerate** actions and the responsible-AI disclaimer footer
- Chat page: AI Elements (Conversation, Message, MessageResponse, PromptInput, Shimmer) with markdown rendering, no Sparkles logo — custom brand mark
- Polished modern SaaS aesthetic (subtle gradients, semantic tokens, dark-mode ready)

### Files (new)

```
src/routes/__root.tsx              (sidebar layout)
src/routes/index.tsx               (dashboard)
src/routes/email.tsx
src/routes/summarize.tsx
src/routes/planner.tsx
src/routes/research.tsx
src/routes/chat.tsx
src/routes/settings.tsx
src/routes/api/chat.ts             (streaming)
src/lib/ai-gateway.server.ts
src/lib/ai.functions.ts            (4 generation server fns + stats)
src/components/app-sidebar.tsx
src/components/ai-output-card.tsx  (edit/copy/regenerate wrapper)
src/components/stat-card.tsx
src/components/brand-mark.tsx
```

Plus AI Elements install: `conversation message prompt-input shimmer`.

### Responsible AI

Every AI output card renders the disclaimer:
> AI-generated content may contain inaccuracies. Always review, verify, and edit outputs before using them in professional environments.

### Out of scope

Auth, multi-user data isolation, billing, export.
