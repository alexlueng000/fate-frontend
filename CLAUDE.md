# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fate Frontend** (一盏大师) is a Chinese astrology/fortune-telling web application providing AI-powered Bazi (八字 - Four Pillars of Destiny) analysis and interpretation.

- **Framework**: Next.js 15.5.0 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Backend**: FastAPI running on `https://api.fateinsight.site`

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Create production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

### Routing Structure
- `/` - Public landing page
- `/login`, `/register` - Authentication pages
- `/panel` - Main user dashboard with paipan creation + chat (requires auth)
- `/chat` - Standalone chat interface (URL params: gender, calendar, birth_date, birth_time, birthplace)
- `/account` - User account page (requires auth)
- `/admin` - Admin dashboard and configuration pages (admin only)
  - `/admin/config/system_prompt` - System prompt editor
  - `/admin/config/quick_buttons` - Quick buttons configuration

### Route Groups
- `(auth)` - Protected route group requiring authentication

### Key Directories
- `app/components/` - Reusable React components
- `app/lib/` - Core utilities and business logic
  - `lib/auth.tsx` - User context and authentication
  - `lib/api.ts` - Centralized API endpoint construction
  - `lib/chat/` - Chat system utilities (types, storage, SSE streaming)
  - `lib/paipan.ts` - Paipan display component

## Important Patterns

### API Communication
All API calls use the centralized `api()` function from `app/lib/api.ts`:
```typescript
import { api } from '@/app/lib/api';
const response = await fetch(api('/chat/start'), ...);
```

The Next.js config proxies `/api/*` to the FastAPI backend at `https://api.fateinsight.site/api/*`.

### Authentication
- User state managed via `UserProvider` context (`app/lib/auth.tsx`)
- `localStorage`: `auth_token` (persistent JWT)
- `sessionStorage`: `me` (user object)
- API requests include both cookies and optional Bearer token
- Admin check: `user.is_admin` boolean

### SSE Streaming
Real-time AI responses use Server-Sent Events (`app/lib/chat/sse.ts`):
- Falls back to one-time fetch if SSE fails
- Handles markdown normalization during streaming
- Extracts `conversation_id` from SSE meta events

### Chat System
**Types** (`app/lib/chat/types.ts`):
```typescript
type Msg = {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  meta?: { kind: string };
};

type Paipan = {
  four_pillars: FourPillars;
  dayun: DayunItem[];
};
```

**Flow**:
1. User enters birth data → `/bazi/calc_paipan` (calculate chart)
2. Chart displayed → `/chat/start` (initial AI reading, streamed)
3. User sends message → `/chat` (follow-up questions, streamed)
4. Quick buttons send pre-configured prompts

**Storage**: Conversations stored in localStorage per conversation ID

### Admin Configuration System
- Configs have version numbers with revision history
- Admins can rollback to previous versions
- Keys: `system_prompt`, `prompt`, `quick_buttons`

### TypeScript Conventions
- Path alias: `@/app/...` for all imports from app directory
- Strict typing with type guards
- Explicit `unknown` handling before type assertions

### UI Conventions

**视觉规范以项目根 `DESIGN.md` 与 `PRODUCT.md` 为唯一来源**，本文件不再单独维护色值 / 圆角 / 字体规范。所有 token 已在 `app/globals.css` 中定义为 CSS variables（`--color-primary`、`--color-bg`、`--shadow-md`、`--radius-lg` 等），新代码必须通过这些变量或预置组件类（`.btn`、`.btn-primary`、`.input`、`.card`、`.wuxing-*`）消费。

关键约束摘要（详见根 DESIGN.md）：
- Primary 朱砂红 `var(--color-primary)` (#B54434)，单页占比 ≤10%
- 圆角 ≤4px（按钮 3px / 卡片 4px / pill 9999px）
- 阴影用暖咖灰 `var(--shadow-sm|md|lg)`，禁止 `rgba(0,0,0,...)` / `#000` / `#fff`
- 中文字 `font-serif`（已映射 Noto Serif SC），英文 `font-sans`（Inter）
- 禁止：glassmorphism、gradient text、装饰动效（pulse/shimmer/rotate）、side-stripe border、嵌套卡、emoji 装饰、Tailwind 默认色板（slate/amber/sky/rose/violet/fuchsia/emerald/orange）
- 所有 interactive 元素：触控 ≥44×44px、`focus-visible:ring-2 ring-[var(--color-primary)]/24`、toggle 组带 `aria-pressed`

- All interactive pages use `'use client'` directive

### Five Elements (WuXing)
Chinese five elements system (`app/components/WuXing.tsx`):
- Elements: 木 (Wood), 火 (Fire), 土 (Earth), 金 (Metal), 水 (Water)
- Color coding: emerald, red, amber/brown, yellow/gold, sky blue

### Markdown Processing
- `react-markdown` with syntax highlighting plugins
- Custom `normalizeMarkdown()` handles malformed AI-generated markdown
- Fixes header levels, list formatting, CJK text spacing

## Backend Dependency

This frontend requires a FastAPI backend running on `https://api.fateinsight.site` for all API calls. The API base URL is configured via `NEXT_PUBLIC_API_BASE` in `.env.local`.

## Localization

The entire UI is in Chinese with specific handling for CJK text in markdown processing and formatting.
