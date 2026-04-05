export interface MindMapNode {
  id: string
  content: string
  children: MindMapNode[]
  payload?: {
    fold?: 0 | 1 | 2
    color?: string
    [key: string]: unknown
  }
}

export interface LLMConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface Settings {
  llm: LLMConfig
  theme: 'light' | 'dark'
  language: 'zh' | 'en'
  expandCount: number
  autoFit: boolean
  initialExpandLevel: number
  customSystemPrompt: string
}

export interface HistoryEntry {
  root: MindMapNode
  selectedNodeId: string | null
}

export type AIAction = 'expand' | 'refine' | 'reorganize' | 'summarize' | 'brainstorm'

export interface AIActionItem {
  key: AIAction
  label: string
  labelEn: string
  description: string
  descriptionEn: string
  icon: string
}

export interface NodePathItem {
  id: string
  content: string
  depth: number
}

export interface ContextMenuPosition {
  x: number
  y: number
}

export interface CustomAction {
  id: string
  name: string
  prompt: string
  icon: string
}
