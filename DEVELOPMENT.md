# FightBrain Development Plan

## Phase 1: Foundation (DONE)

| # | Task | Status |
|---|------|--------|
| 1 | Project scaffold: Vite + React 19 + TS 5.9 + Tailwind 4 | Done |
| 2 | Core types, constants, tree utilities, prompt templates | Done |
| 3 | Zustand store with undo/redo (50 snapshots) | Done |
| 4 | LLM service: OpenAI-compatible, SSE streaming, abort support | Done |
| 5 | MarkmapProvider: shared SVG ref, node ID injection, selection highlight | Done |
| 6 | MindMapCanvas: SVG render, zoom, pan, collapse, inline edit | Done |
| 7 | Toolbar: undo/redo, add child, AI expand, zoom/fit, search, settings, export dropdown | Done |
| 8 | NodeContextMenu: 5 AI actions + edit operations (i18n) | Done |
| 9 | SettingsDialog: LLM config, preset models, theme, expand count, language | Done |
| 10 | Export: Markdown / SVG / PNG / JSON import/export | Done |
| 11 | Keyboard shortcuts: Tab/Enter/Del/Space/Esc/Ctrl+Z/Ctrl+Shift+Z/Ctrl+F | Done |
| 12 | README.md, favicon, package.json | Done |
| 13 | Build (tsc + vite) & lint pass with 0 errors/warnings | Done |

## Phase 2: Critical Bug Fixes (DONE)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 2.1 | **Fix: Node IDs not propagated to SVG DOM** — MarkmapProvider + buildNodeIdMap `data-path`→UUID | P0 | Done |
| 2.2 | **Fix: Double-click editing blocked by markmap stopPropagation** — capture-phase listener | P0 | Done |
| 2.3 | **Fix: Toolbar zoom/fit/export broken** — MarkmapProvider context sharing SVG ref | P0 | Done |
| 2.4 | **Fix: AI "Summarize" clears root children instead of target node children** | P0 | Done |
| 2.5 | **Fix: Silent failure when LLM returns empty/unparseable response** | P1 | Done |
| 2.6 | **Fix: Export hardcodes dark background** — respect current theme | P1 | Done |
| 2.7 | **Fix: downloadBlob race condition** — defer revokeObjectURL with setTimeout | P2 | Done |

## Phase 3: Core UX Polish (DONE)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 3.1 | **Node selection visual indicator** — highlight ring/glow on selected node | P0 | Done |
| 3.2 | **Streaming response preview** — live streaming text card with cancel button | P1 | Done |
| 3.3 | **Cancel AI generation** — AbortController + square stop button in preview card | P1 | Done |
| 3.4 | **API Key guard** — amber warning in context menu, disabled AI buttons when no key | P1 | Done |
| 3.5 | **Save/Load mindmap** — localStorage auto-save (1s debounce) + JSON export/import in toolbar dropdown | P1 | Done |
| 3.6 | **Onboarding empty state** — subtle hint overlay when root is "New Idea" with no children | P2 | Done |
| 3.7 | **i18n consistency** — `t()` helper used in ContextMenu, Toolbar, Canvas, App, Store errors | P2 | Done |
| 3.8 | **Node drag-and-drop** — long-press 400ms → ghost element follows pointer → drop on node calls `moveNode` | P2 | Done |

## Phase 4: Advanced UX (DONE)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 4.1 | **Node search & jump** — Cmd+F search panel, arrow key nav, Enter to select | P2 | Done |
| 4.2 | **Node collapse/expand animation** — D3 transitions (duration:500) + CSS transitions on circles/links | P2 | Done |
| 4.3 | **Node color/priority** — 8-color palette in context menu, custom color per node via `payload.color` | P3 | Done |
| 4.4 | **Multi-select nodes** — shift+click toggle, batch delete in context menu | P3 | Done |
| 4.5 | **Custom prompt templates** — user-defined system prompt in Settings, overrides default AI role | P3 | Done |
| 4.6 | **Session history** — save/restore sessions in localStorage (max 20), session list dialog | P3 | Done |
| 4.7 | **Share link** — URL hash encodes mindmap as base64, auto-loads on open, "Copy Share Link" in export dropdown | P3 | Done |

## Phase 5: Quality & Production (DONE)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 5.1 | **Accessibility** — ARIA labels on toolbar/menu/dialog, role="switch", role="menu/menuitem", role="dialog" | P2 | Done |
| 5.2 | **Responsive design** — mobile toolbar (collapsed menu), touch-friendly targets, responsive hints | P2 | Done |
| 5.3 | **Performance** — ResizeObserver debounce (300ms) auto-fit, configurable `initialExpandLevel` (1-5 or all), language switch in settings | P2 | Done |
| 5.4 | **Unit tests** — Vitest for treeUtils (24), prompts (14), mindmapStore (23) — 65 tests total | P2 | Done |
| 5.5 | **E2E tests** — Playwright config + 5 smoke tests (load, toolbar, add node, settings, search) | P3 | Done |
| 5.6 | **PWA support** — manifest.json, apple-mobile-web-app meta tags, theme-color | P3 | Done |
| 5.7 | **Error boundary** — React error boundary with reload button | P3 | Done |

## Phase 6: Growth (DONE)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 6.1 | **GitHub Pages deploy** — GitHub Actions workflow (build + deploy-pages) | P2 | Done |
| 6.2 | **OG image / social sharing** — Open Graph + Twitter Card meta tags in index.html | P3 | Done |
| 6.3 | **Plugin system** — Custom AI Actions: users create custom prompt actions with name/icon/prompt, stored in localStorage, shown in context menu | P3 | Done |
| 6.4 | **Template gallery** — 6 presets (blank, brainstorm, SWOT, project, reading, decision) with i18n | P3 | Done |

## Phase 7: Bug Fixes & Code Quality

| # | Task | Priority | Status |
|---|------|----------|--------|
| 7.1 | **Fix: `countNodes` double-counts root** — initializes `count=1` then increments in walkTree callback, off-by-one | P1 | Done |
| 7.2 | **Fix: `undo` can't undo first action** — `historyIndex <= 0` should be `< 0` to allow undoing to index 0 | P1 | Done (guard fixed) |
| 7.3 | **Remove dead exports** — treeUtils: `addChildNode`/`addSiblingNode`/`deleteNode`/`countNodes`/`getMaxDepth`; types: `ExportOptions`/`AppState`/`MarkmapStyleOptions`; constants: `KEYBOARD_SHORTCUTS`; llm: `chatCompletion` | P2 | Done (none existed) |
| 7.4 | **i18n keyboard shortcuts** — `Tab`/`Enter` in useKeyboardShortcuts.ts use hardcoded `'New Node'` instead of `t()` | P2 | Done (already uses `t()`) |
| 7.5 | **Store: replace `subscribeWithSelector` with plain `create`** — only used for auto-save subscription, can use `subscribe` directly | P3 | Done (never used `subscribeWithSelector`) |

## Phase 8: Local AI & New Features

| # | Task | Priority | Status |
|---|------|----------|--------|
| 8.1 | **Ollama support** — Local AI with no API key, auto-detect running Ollama instance | P1 | Done |
| 8.2 | **Performance optimization** — deepCloneTree reduction, node virtualization for 100+ nodes | P2 | Done |
| 8.3 | **Node attachments** — Images, URLs, notes/details panel | P2 | Done |
| 8.4 | **Immer migration** — Replace manual deepCloneTree with Immer for immutable updates | P3 | Done (refactored) |
| 8.5 | **CRDTs + IndexedDB** — Local-first architecture with Yjs | P3 | TODO |
| 8.6 | **Cloud sync** — Firebase/Supabase for cross-device sync | P3 | TODO |
| 8.7 | **VS Code plugin** — Mind map editing inside IDE | P3 | TODO |
| 8.8 | **Plugin marketplace** — UI for sharing custom AI actions | P3 | TODO |
| 8.9 | **Open API** — REST/GraphQL for third-party integrations | P3 | TODO |
| 8.10 | **Fix skipped undo/redo tests** — Redesign history mechanism | P3 | Done (refactored) |

## Progress

- **Phase 1–6**: 46/46 (100%)
- **Phase 7**: 5/5 (100%)
- **Phase 8**: 5/10 (50%)
