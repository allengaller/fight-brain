import { useCallback } from 'react'
import type { MindMapNode } from '@/types'
import { createNode, createRootNode } from '@/utils/treeUtils'

export interface Template {
  id: string
  name: string
  nameEn: string
  icon: string
  description: string
  descriptionEn: string
  build: (lang: 'zh' | 'en') => MindMapNode
}

const templates: Template[] = [
  {
    id: 'blank',
    name: '空白脑图',
    nameEn: 'Blank Mind Map',
    icon: '📄',
    description: '从零开始',
    descriptionEn: 'Start from scratch',
    build: () => createRootNode('New Idea'),
  },
  {
    id: 'brainstorm',
    name: '头脑风暴',
    nameEn: 'Brainstorm',
    icon: '💡',
    description: '自由发散创意',
    descriptionEn: 'Free-form creative brainstorming',
    build: (lang) => {
      const root = createRootNode(lang === 'zh' ? '头脑风暴主题' : 'Brainstorm Topic')
      root.children = [
        createNode(lang === 'zh' ? '核心问题' : 'Core Problem'),
        createNode(lang === 'zh' ? '目标用户' : 'Target Users'),
        createNode(lang === 'zh' ? '关键资源' : 'Key Resources'),
        createNode(lang === 'zh' ? '潜在风险' : 'Potential Risks'),
        createNode(lang === 'zh' ? '创新方向' : 'Innovation Directions'),
      ]
      return root
    },
  },
  {
    id: 'swot',
    name: 'SWOT 分析',
    nameEn: 'SWOT Analysis',
    icon: '📊',
    description: '优势、劣势、机会、威胁',
    descriptionEn: 'Strengths, Weaknesses, Opportunities, Threats',
    build: (lang) => {
      const root = createRootNode(lang === 'zh' ? 'SWOT 分析' : 'SWOT Analysis')
      root.children = [
        createNode(lang === 'zh' ? '优势 (S)' : 'Strengths (S)', [
          createNode(lang === 'zh' ? '核心竞争力' : 'Core Strength'),
          createNode(lang === 'zh' ? '独特资源' : 'Unique Resources'),
        ]),
        createNode(lang === 'zh' ? '劣势 (W)' : 'Weaknesses (W)', [
          createNode(lang === 'zh' ? '关键短板' : 'Key Weakness'),
          createNode(lang === 'zh' ? '资源不足' : 'Resource Gaps'),
        ]),
        createNode(lang === 'zh' ? '机会 (O)' : 'Opportunities (O)', [
          createNode(lang === 'zh' ? '市场趋势' : 'Market Trends'),
          createNode(lang === 'zh' ? '技术突破' : 'Tech Breakthroughs'),
        ]),
        createNode(lang === 'zh' ? '威胁 (T)' : 'Threats (T)', [
          createNode(lang === 'zh' ? '竞争压力' : 'Competition'),
          createNode(lang === 'zh' ? '政策变化' : 'Regulation Changes'),
        ]),
      ]
      return root
    },
  },
  {
    id: 'project',
    name: '项目规划',
    nameEn: 'Project Planning',
    icon: '📋',
    description: '目标、里程碑、资源分配',
    descriptionEn: 'Goals, milestones, resource allocation',
    build: (lang) => {
      const root = createRootNode(lang === 'zh' ? '项目名称' : 'Project Name')
      root.children = [
        createNode(lang === 'zh' ? '目标与愿景' : 'Goals & Vision'),
        createNode(lang === 'zh' ? '里程碑' : 'Milestones', [
          createNode(lang === 'zh' ? '阶段一' : 'Phase 1'),
          createNode(lang === 'zh' ? '阶段二' : 'Phase 2'),
          createNode(lang === 'zh' ? '阶段三' : 'Phase 3'),
        ]),
        createNode(lang === 'zh' ? '团队与资源' : 'Team & Resources'),
        createNode(lang === 'zh' ? '风险评估' : 'Risk Assessment'),
        createNode(lang === 'zh' ? '时间线' : 'Timeline'),
      ]
      return root
    },
  },
  {
    id: 'reading',
    name: '读书笔记',
    nameEn: 'Reading Notes',
    icon: '📚',
    description: '章节摘要与思考',
    descriptionEn: 'Chapter summaries and reflections',
    build: (lang) => {
      const root = createRootNode(lang === 'zh' ? '书名' : 'Book Title')
      root.children = [
        createNode(lang === 'zh' ? '核心观点' : 'Key Ideas'),
        createNode(lang === 'zh' ? '精彩摘录' : 'Highlights'),
        createNode(lang === 'zh' ? '个人思考' : 'Reflections'),
        createNode(lang === 'zh' ? '行动计划' : 'Action Items'),
      ]
      return root
    },
  },
  {
    id: 'decision',
    name: '决策分析',
    nameEn: 'Decision Matrix',
    icon: '⚖️',
    description: '多方案对比与决策',
    descriptionEn: 'Compare options and make decisions',
    build: (lang) => {
      const root = createRootNode(lang === 'zh' ? '决策主题' : 'Decision Topic')
      root.children = [
        createNode(lang === 'zh' ? '方案 A' : 'Option A'),
        createNode(lang === 'zh' ? '方案 B' : 'Option B'),
        createNode(lang === 'zh' ? '方案 C' : 'Option C'),
        createNode(lang === 'zh' ? '评估标准' : 'Evaluation Criteria', [
          createNode(lang === 'zh' ? '成本' : 'Cost'),
          createNode(lang === 'zh' ? '可行性' : 'Feasibility'),
          createNode(lang === 'zh' ? '影响力' : 'Impact'),
        ]),
      ]
      return root
    },
  },
]

export function getTemplates(): Template[] {
  return templates
}

export function getTemplateById(id: string): Template | undefined {
  return templates.find(t => t.id === id)
}

export function applyTemplate(id: string, lang: 'zh' | 'en'): MindMapNode | null {
  const template = getTemplateById(id)
  if (!template) return null
  return template.build(lang)
}

export function useTemplates() {
  const templatesList = getTemplates()
  const apply = useCallback(
    (id: string, lang: 'zh' | 'en') => applyTemplate(id, lang),
    [],
  )
  return { templates: templatesList, apply }
}
