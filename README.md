<p align="center">
  <img src="public/favicon.svg" width="80" height="80" alt="FightBrain Logo">
  <br>
  <strong>FightBrain</strong>
</p>

<p align="center">
  AI-powered mind map brainstorming tool in your browser.
  <br>
  Expand, refine, and reorganize your ideas with LLM.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-8-purple" alt="Vite">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

---

## Features

- **Mind Map Canvas** — Interactive SVG-based mind map with zoom, pan, and collapse
- **AI-Powered Expansion** — Click any node and let LLM generate sub-topics (5 AI actions)
- **Node Editing** — Double-click to edit, right-click for full context menu
- **Keyboard Shortcuts** — Tab (add child), Enter (add sibling), Del (delete), Space (collapse), Ctrl+Z (undo)
- **Undo/Redo** — Full history stack with up to 50 snapshots
- **Export** — Markdown, SVG, and PNG export
- **Dark/Light Theme** — System-aware with manual toggle
- **Multi-LLM Support** — Works with any OpenAI-compatible API (Kimi, OpenAI, etc.)
- **Zero Backend** — Pure static site, API keys stored in your browser

## AI Actions

| Action | Description |
|--------|-------------|
| **Expand** | Generate creative sub-topics for a node |
| **Refine** | Optimize node wording for clarity |
| **Reorganize** | Merge, sort, and reclassify children |
| **Summarize** | Compress subtree into a summary |
| **Brainstorm** | Free-association creative expansion |

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Configuration

1. Open the app and click the **Settings** icon (gear) in the top-right toolbar
2. Select a preset model or enter custom API configuration:
   - **Kimi K2.5** — `https://api.moonshot.cn/v1`
   - **OpenAI GPT-4o** — `https://api.openai.com/v1`
   - Or any OpenAI-compatible endpoint
3. Paste your API key
4. Right-click any node to start brainstorming with AI

## Project Structure

```
src/
├── types/           # TypeScript type definitions
├── store/           # Zustand state management (undo/redo)
├── services/        # LLM API client (streaming SSE)
├── hooks/           # React hooks (Markmap lifecycle)
├── utils/           # Tree utilities & prompt templates
├── components/
│   ├── MindMap/     # SVG mind map canvas
│   ├── Toolbar/     # Top toolbar & keyboard shortcuts
│   ├── NodeActions/ # Right-click context menu
│   └── Settings/    # Settings dialog & export
├── App.tsx          # Root component
└── index.css        # Tailwind + markmap styles
```

## Tech Stack

- **React 19** + **TypeScript** — UI framework
- **Vite** — Build tool
- **Markmap** — Mind map rendering (SVG + D3)
- **Zustand** — State management
- **Tailwind CSS 4** — Styling
- **Lucide** — Icons

## License

MIT
