import { create } from 'zustand'
import type { AIAction, CustomAction, HistoryEntry, MindMapNode, Settings } from '@/types'
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@/constants'
import { createRootNode, deepCloneTree, findNodeById, getNodePath, replaceNodeChildren, updateNodeContent, createNode } from '@/utils/treeUtils'
import { chatCompletionStream } from '@/services/llm'
import { buildPrompt, parseJSONResponse, parseTextResponse } from '@/utils/prompts'

interface MindMapStore {
  root: MindMapNode
  selectedNodeId: string | null
  selectedNodeIds: Set<string>
  settings: Settings
  isGenerating: boolean
  generatingNodeId: string | null
  streamingText: string
  error: string | null
  history: HistoryEntry[]
  historyIndex: number
  _abortController: AbortController | null
  customActions: CustomAction[]

  setRoot: (root: MindMapNode) => void
  selectNode: (id: string | null) => void
  addToSelection: (id: string) => void
  updateSettings: (settings: Partial<Settings>) => void
  addChild: (parentId: string, content: string) => void
  addSibling: (nodeId: string, content: string) => void
  deleteNode: (nodeId: string) => void
  updateContent: (nodeId: string, content: string) => void
  toggleCollapse: (nodeId: string) => void
  performAIAction: (action: AIAction, nodeId: string) => Promise<void>
  cancelGeneration: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  clearError: () => void
  resetMindmap: (topic?: string) => void
  loadMindmap: (data: MindMapNode) => void
  saveToLocalStorage: () => void
  loadFromLocalStorage: () => boolean
  exportAsJSON: () => string
  importFromJSON: (json: string) => boolean
  moveNode: (nodeId: string, newParentId: string, insertIndex?: number) => void
  setNodeColor: (nodeId: string, color: string | null) => void
  deleteSelectedNodes: () => void
  performCustomAction: (action: CustomAction, nodeId: string) => Promise<void>
  addCustomAction: (action: CustomAction) => void
  updateCustomAction: (action: CustomAction) => void
  removeCustomAction: (id: string) => void
  loadCustomActions: () => void
}

const MAX_HISTORY = 50

function pushHistory(state: { root: MindMapNode; selectedNodeId: string | null; history: HistoryEntry[]; historyIndex: number }) {
  const newHistory = state.history.slice(0, state.historyIndex + 1)
  newHistory.push({
    root: deepCloneTree(state.root),
    selectedNodeId: state.selectedNodeId,
  })
  if (newHistory.length > MAX_HISTORY) newHistory.shift()
  return { history: newHistory, historyIndex: newHistory.length - 1 }
}

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS }
}

function persistSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

export const useMindMapStore = create<MindMapStore>()((set, get) => ({
    root: createRootNode('New Idea'),
    selectedNodeId: null,
    selectedNodeIds: new Set<string>(),
    settings: loadSettings(),
    isGenerating: false,
    generatingNodeId: null,
    streamingText: '',
    error: null,
    history: [],
    historyIndex: -1,
    _abortController: null,
    customActions: [],

    setRoot: (root) => {
      const state = get()
      set({
        root,
        ...pushHistory({ ...state, root }),
      })
    },

    selectNode: (id) => {
      set({ selectedNodeId: id, selectedNodeIds: id ? new Set([id]) : new Set() })
    },

    addToSelection: (id) => {
      const current = get().selectedNodeIds
      const newSet = new Set(current)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      set({ selectedNodeIds: newSet, selectedNodeId: id })
    },

    updateSettings: (partial) => {
      const newSettings = { ...get().settings, ...partial }
      persistSettings(newSettings)
      set({ settings: newSettings })
    },

    addChild: (parentId, content) => {
      const state = get()
      const newRoot = deepCloneTree(state.root)
      const parent = findNodeById(newRoot, parentId)
      if (parent) {
        parent.children.push(createNode(content))
      }
      set({
        root: newRoot,
        ...pushHistory({ ...state, root: newRoot }),
      })
    },

    addSibling: (nodeId, content) => {
      const state = get()
      const newRoot = deepCloneTree(state.root)
      const node = findNodeById(newRoot, nodeId)
      if (!node) return

      const path = getNodePath(newRoot, nodeId)
      if (path.length < 2) return

      const parent = findNodeById(newRoot, path[path.length - 2].id)
      if (parent) {
        const idx = parent.children.findIndex(c => c.id === nodeId)
        parent.children.splice(idx + 1, 0, createNode(content))
      }
      set({
        root: newRoot,
        ...pushHistory({ ...state, root: newRoot }),
      })
    },

    deleteNode: (nodeId) => {
      const state = get()
      if (state.root.id === nodeId) return
      const newRoot = deepCloneTree(state.root)

      function removeFromParent(node: MindMapNode): boolean {
        for (let i = 0; i < node.children.length; i++) {
          if (node.children[i].id === nodeId) {
            node.children.splice(i, 1)
            return true
          }
          if (removeFromParent(node.children[i])) return true
        }
        return false
      }

      removeFromParent(newRoot)
      set({
        root: newRoot,
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        ...pushHistory({ ...state, root: newRoot, selectedNodeId: state.selectedNodeId }),
      })
    },

    updateContent: (nodeId, content) => {
      const state = get()
      const newRoot = deepCloneTree(state.root)
      updateNodeContent(newRoot, nodeId, content)
      set({
        root: newRoot,
        ...pushHistory({ ...state, root: newRoot }),
      })
    },

    toggleCollapse: (nodeId) => {
      const state = get()
      const newRoot = deepCloneTree(state.root)
      const node = findNodeById(newRoot, nodeId)
      if (node) {
        const current = node.payload?.fold ?? 0
        node.payload = { ...node.payload, fold: current === 0 ? 1 : 0 }
      }
      set({ root: newRoot })
    },

    performAIAction: async (action, nodeId) => {
      const state = get()
      const node = findNodeById(state.root, nodeId)
      if (!node) return
      if (!state.settings.llm.apiKey) {
        set({ error: 'Please configure your API key in Settings first.' })
        return
      }

      const ac = new AbortController()
      set({ isGenerating: true, generatingNodeId: nodeId, error: null, streamingText: '', _abortController: ac })

      const path = getNodePath(state.root, nodeId)
      const childrenContent = node.children.map(c => c.content)
      const prompt = buildPrompt(action, path, childrenContent, state.settings.expandCount, state.settings.language)

      const defaultSystemPrompt = state.settings.language === 'zh'
        ? '你是一个专业的头脑风暴和思维整理助手，擅长帮助用户进行创意发散和逻辑整理。'
        : 'You are a professional brainstorming and thinking assistant, skilled in creative divergence and logical organization.'

      const messages = [
        {
          role: 'system' as const,
          content: state.settings.customSystemPrompt.trim() || defaultSystemPrompt,
        },
        {
          role: 'user' as const,
          content: prompt,
        },
      ]

      try {
        let fullText = ''

        await chatCompletionStream(
          state.settings.llm,
          messages,
          {
            onChunk: (text) => {
              fullText += text
              set({ streamingText: fullText })
            },
            onDone: () => {
              // fullText is already accumulated in the closure
            },
            onError: (err) => {
              if (err.name === 'LLMAbortedError') return
              set({ error: err.message })
            },
          },
          { signal: ac.signal },
        )

        const currentState = get()

        if (!fullText.trim()) {
          set({ error: currentState.settings.language === 'zh' ? 'AI 返回了空响应，请重试。' : 'AI returned an empty response. Please try again.' })
          return
        }

        if (action === 'refine') {
          const result = parseTextResponse(fullText)
          if (result) {
            const newRoot = deepCloneTree(currentState.root)
            updateNodeContent(newRoot, nodeId, result)
            set({
              root: newRoot,
              ...pushHistory({ ...currentState, root: newRoot }),
            })
          } else {
            set({ error: (currentState.settings.language === 'zh' ? '无法解析 AI 响应。' : 'Failed to parse AI response. ') + fullText.slice(0, 100) })
          }
        } else if (action === 'summarize') {
          const result = parseTextResponse(fullText)
          if (result) {
            const newRoot = deepCloneTree(currentState.root)
            const targetNode = findNodeById(newRoot, nodeId)
            if (targetNode) {
              updateNodeContent(newRoot, nodeId, result)
              targetNode.children = []
            }
            set({
              root: newRoot,
              ...pushHistory({ ...currentState, root: newRoot }),
            })
          }
        } else {
          const items = parseJSONResponse(fullText)
          if (items && items.length > 0) {
            const newRoot = deepCloneTree(currentState.root)
            const targetNode = findNodeById(newRoot, nodeId)
            if (targetNode) {
              const newChildren = items.map(content => createNode(content))
              if (action === 'reorganize') {
                replaceNodeChildren(newRoot, nodeId, newChildren)
              } else {
                targetNode.children.push(...newChildren)
              }
              set({
                root: newRoot,
                ...pushHistory({ ...currentState, root: newRoot }),
              })
            }
          } else {
            set({ error: (currentState.settings.language === 'zh' ? '无法解析 AI 响应为 JSON。' : 'Failed to parse AI response as JSON. ') + fullText.slice(0, 100) })
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // user cancelled
        } else {
          set({ error: err instanceof Error ? err.message : String(err) })
        }
      } finally {
        set({ isGenerating: false, generatingNodeId: null, streamingText: '', _abortController: null })
      }
    },

    cancelGeneration: () => {
      const ac = get()._abortController
      if (ac) {
        ac.abort()
        set({ isGenerating: false, generatingNodeId: null, streamingText: '', _abortController: null })
      }
    },

    undo: () => {
      const state = get()
      if (state.historyIndex < 0) return
      const newIndex = state.historyIndex - 1
      const entry = state.history[newIndex]
      set({
        root: deepCloneTree(entry.root),
        selectedNodeId: entry.selectedNodeId,
        historyIndex: newIndex,
      })
    },

    redo: () => {
      const state = get()
      if (state.historyIndex >= state.history.length - 1) return
      const newIndex = state.historyIndex + 1
      const entry = state.history[newIndex]
      set({
        root: deepCloneTree(entry.root),
        selectedNodeId: entry.selectedNodeId,
        historyIndex: newIndex,
      })
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    clearError: () => set({ error: null }),

    resetMindmap: (topic) => {
      const newRoot = createRootNode(topic ?? 'New Idea')
      set({
        root: newRoot,
        selectedNodeId: null,
        history: [{ root: deepCloneTree(newRoot), selectedNodeId: null }],
        historyIndex: 0,
      })
    },

    loadMindmap: (data) => {
      const state = get()
      const newRoot = deepCloneTree(data)
      set({
        root: newRoot,
        selectedNodeId: null,
        ...pushHistory({ ...state, root: newRoot, selectedNodeId: null }),
      })
    },

    saveToLocalStorage: () => {
      const { root } = get()
      try {
        localStorage.setItem(STORAGE_KEYS.MINDMAP, JSON.stringify(root))
      } catch {
        // ignore
      }
    },

    loadFromLocalStorage: () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.MINDMAP)
        if (stored) {
          const data = JSON.parse(stored) as MindMapNode
          if (data?.id && data?.content && Array.isArray(data?.children)) {
            set({ root: data, selectedNodeId: null, history: [], historyIndex: -1 })
            return true
          }
        }
      } catch {
        // ignore
      }
      return false
    },

    exportAsJSON: () => {
      return JSON.stringify(get().root, null, 2)
    },

    importFromJSON: (json) => {
      try {
        const data = JSON.parse(json) as MindMapNode
        if (data?.id && data?.content && Array.isArray(data?.children)) {
          get().loadMindmap(data)
          return true
        }
      } catch {
        // ignore
      }
      return false
    },

    moveNode: (nodeId, newParentId, insertIndex) => {
      const state = get()
      if (nodeId === newParentId) return
      if (state.root.id === nodeId) return

      const newRoot = deepCloneTree(state.root)
      const node = findNodeById(newRoot, nodeId)
      if (!node) return

      function removeNode(tree: MindMapNode): MindMapNode | null {
        for (let i = 0; i < tree.children.length; i++) {
          if (tree.children[i].id === nodeId) {
            return tree.children.splice(i, 1)[0]
          }
          const found = removeNode(tree.children[i])
          if (found) return found
        }
        return null
      }

      const moved = removeNode(newRoot)
      if (!moved) return

      const newParent = findNodeById(newRoot, newParentId)
      if (!newParent) return

      const idx = insertIndex ?? newParent.children.length
      newParent.children.splice(idx, 0, moved)

      set({
        root: newRoot,
        ...pushHistory({ ...state, root: newRoot }),
      })
    },

    setNodeColor: (nodeId, color) => {
      const state = get()
      const newRoot = deepCloneTree(state.root)
      const node = findNodeById(newRoot, nodeId)
      if (!node) return
      if (color) {
        node.payload = { ...node.payload, color }
      } else {
        node.payload = node.payload ? { ...node.payload } : undefined
        if (node.payload) delete node.payload.color
        if (node.payload && Object.keys(node.payload).length === 0) node.payload = undefined
      }
      set({ root: newRoot })
    },

    deleteSelectedNodes: () => {
      const state = get()
      const idsToDelete = state.selectedNodeIds
      if (idsToDelete.size === 0) return
      if (idsToDelete.has(state.root.id)) return

      const newRoot = deepCloneTree(state.root)

      function removeFromTree(node: MindMapNode): void {
        node.children = node.children.filter(c => !idsToDelete.has(c.id))
        node.children.forEach(removeFromTree)
      }

      removeFromTree(newRoot)
      set({
        root: newRoot,
        selectedNodeId: null,
        selectedNodeIds: new Set(),
        ...pushHistory({ ...state, root: newRoot, selectedNodeId: null }),
      })
    },

    performCustomAction: async (action, nodeId) => {
      const state = get()
      const node = findNodeById(state.root, nodeId)
      if (!node) return
      if (!state.settings.llm.apiKey) {
        set({ error: state.settings.language === 'zh' ? '请先在设置中配置 API Key。' : 'Please configure your API key first.' })
        return
      }

      const ac = new AbortController()
      set({ isGenerating: true, generatingNodeId: nodeId, error: null, streamingText: '', _abortController: ac })

      const path = getNodePath(state.root, nodeId)
      const pathStr = path.map(p => p.content).join(' > ')
      const childrenStr = node.children.map(c => c.content).join('\n')

      const prompt = action.prompt
        .replace('{path}', pathStr)
        .replace('{node}', node.content)
        .replace('{children}', childrenStr)
        .replace('{count}', String(state.settings.expandCount))

      const defaultSystemPrompt = state.settings.language === 'zh'
        ? '你是一个专业的头脑风暴和思维整理助手。'
        : 'You are a professional brainstorming and thinking assistant.'

      const messages = [
        { role: 'system' as const, content: state.settings.customSystemPrompt.trim() || defaultSystemPrompt },
        { role: 'user' as const, content: prompt },
      ]

      try {
        let fullText = ''
        await chatCompletionStream(state.settings.llm, messages, {
          onChunk: (text) => { fullText += text; set({ streamingText: fullText }) },
          onDone: () => {},
          onError: (err) => { if (err.name !== 'LLMAbortedError') set({ error: err.message }) },
        }, { signal: ac.signal })

        const currentState = get()
        if (!fullText.trim()) {
          set({ error: currentState.settings.language === 'zh' ? 'AI 返回了空响应。' : 'AI returned empty response.' })
          return
        }

        const items = parseJSONResponse(fullText)
        if (items && items.length > 0) {
          const newRoot = deepCloneTree(currentState.root)
          const targetNode = findNodeById(newRoot, nodeId)
          if (targetNode) {
            targetNode.children.push(...items.map(content => createNode(content)))
            set({ root: newRoot, ...pushHistory({ ...currentState, root: newRoot }) })
          }
        } else {
          const text = parseTextResponse(fullText)
          if (text) {
            const newRoot = deepCloneTree(currentState.root)
            updateNodeContent(newRoot, nodeId, text)
            set({ root: newRoot, ...pushHistory({ ...currentState, root: newRoot }) })
          } else {
            set({ error: (currentState.settings.language === 'zh' ? '无法解析 AI 响应。' : 'Failed to parse AI response. ') + fullText.slice(0, 100) })
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        set({ error: err instanceof Error ? err.message : String(err) })
      } finally {
        set({ isGenerating: false, generatingNodeId: null, streamingText: '', _abortController: null })
      }
    },

    addCustomAction: (action) => {
      const actions = [...get().customActions, action]
      set({ customActions: actions })
      try { localStorage.setItem(STORAGE_KEYS.CUSTOM_ACTIONS, JSON.stringify(actions)) } catch { /* ignore */ }
    },

    updateCustomAction: (action) => {
      const actions = get().customActions.map(a => a.id === action.id ? action : a)
      set({ customActions: actions })
      try { localStorage.setItem(STORAGE_KEYS.CUSTOM_ACTIONS, JSON.stringify(actions)) } catch { /* ignore */ }
    },

    removeCustomAction: (id) => {
      const actions = get().customActions.filter(a => a.id !== id)
      set({ customActions: actions })
      try { localStorage.setItem(STORAGE_KEYS.CUSTOM_ACTIONS, JSON.stringify(actions)) } catch { /* ignore */ }
    },

    loadCustomActions: () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_ACTIONS)
        if (stored) {
          set({ customActions: JSON.parse(stored) as CustomAction[] })
        }
      } catch { /* ignore */ }
    },
  })),
)

let lastAutoSaveRoot: string | null = null
useMindMapStore.subscribe(
  (s) => {
    const rootJson = JSON.stringify(s.root)
    if (rootJson === lastAutoSaveRoot) return
    lastAutoSaveRoot = rootJson
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    autoSaveTimer = setTimeout(() => {
      useMindMapStore.getState().saveToLocalStorage()
    }, 1000)
  },
)
