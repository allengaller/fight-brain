import type { AIActionItem, LLMConfig, Settings } from '@/types'

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  apiKey: '',
  baseUrl: 'https://api.moonshot.cn/v1',
  model: 'kimi-k2.5',
}

export const PRESET_MODELS = [
  {
    name: 'Kimi K2.5',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'kimi-k2.5',
  },
  {
    name: 'Kimi K2 Turbo',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'kimi-k2-turbo-preview',
  },
  {
    name: 'Moonshot v1 128K',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-128k',
  },
  {
    name: 'OpenAI GPT-4o',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
  },
  {
    name: 'OpenAI GPT-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  {
    name: 'Custom',
    baseUrl: '',
    model: '',
  },
] as const

export const AI_ACTIONS: AIActionItem[] = [
  {
    key: 'expand',
    label: '展开子节点',
    labelEn: 'Expand',
    description: 'AI 为当前节点生成子主题',
    descriptionEn: 'Generate sub-topics for this node',
    icon: 'GitBranch',
  },
  {
    key: 'refine',
    label: '精炼内容',
    labelEn: 'Refine',
    description: '优化当前节点的文字表述',
    descriptionEn: 'Improve wording of this node',
    icon: 'Sparkles',
  },
  {
    key: 'reorganize',
    label: '重新整理',
    labelEn: 'Reorganize',
    description: '对子节点进行分类、合并、排序',
    descriptionEn: 'Reclassify, merge, and sort children',
    icon: 'RefreshCw',
  },
  {
    key: 'summarize',
    label: '总结归纳',
    labelEn: 'Summarize',
    description: '将子树压缩为精炼摘要',
    descriptionEn: 'Compress subtree into a summary',
    icon: 'Minimize2',
  },
  {
    key: 'brainstorm',
    label: '自由发散',
    labelEn: 'Brainstorm',
    description: '自由联想式创意扩展',
    descriptionEn: 'Free-association creative expansion',
    icon: 'Zap',
  },
]

export const DEFAULT_SETTINGS: Settings = {
  llm: DEFAULT_LLM_CONFIG,
  theme: 'dark',
  language: 'zh',
  expandCount: 5,
  autoFit: true,
  initialExpandLevel: -1,
  customSystemPrompt: '',
}

export const STORAGE_KEYS = {
  SETTINGS: 'fightbrain-settings',
  MINDMAP: 'fightbrain-mindmap',
  SESSIONS: 'fightbrain-sessions',
  CUSTOM_ACTIONS: 'fightbrain-custom-actions',
} as const

