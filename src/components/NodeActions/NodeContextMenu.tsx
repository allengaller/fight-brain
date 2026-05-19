import { useCallback, useEffect, useState } from 'react'
import {
  GitBranch,
  Sparkles,
  RefreshCw,
  Minimize2,
  Zap,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Palette,
  Image,
  Link2,
  FileText,
} from 'lucide-react'
import type { AIAction, ContextMenuPosition, CustomAction } from '@/types'
import { AI_ACTIONS } from '@/constants'
import { useMindMapStore } from '@/store/mindmapStore'
import { findNodeById } from '@/utils/treeUtils'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  GitBranch,
  Sparkles,
  RefreshCw,
  Minimize2,
  Zap,
}

const t = (zh: string, en: string, lang: 'zh' | 'en') => (lang === 'zh' ? zh : en)

export function NodeContextMenu() {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 })
  const [nodeId, setNodeId] = useState<string | null>(null)

  const isGenerating = useMindMapStore((s) => s.isGenerating)
  const hasApiKey = !!useMindMapStore((s) => s.settings.llm.apiKey)
  const language = useMindMapStore((s) => s.settings.language)
  const root = useMindMapStore((s) => s.root)
  const selectedNodeIds = useMindMapStore((s) => s.selectedNodeIds)
  const addChild = useMindMapStore((s) => s.addChild)
  const addSibling = useMindMapStore((s) => s.addSibling)
  const deleteNode = useMindMapStore((s) => s.deleteNode)
  const deleteSelectedNodes = useMindMapStore((s) => s.deleteSelectedNodes)
  const toggleCollapse = useMindMapStore((s) => s.toggleCollapse)
  const performAIAction = useMindMapStore((s) => s.performAIAction)
  const performCustomAction = useMindMapStore((s) => s.performCustomAction)
  const setNodeColor = useMindMapStore((s) => s.setNodeColor)
  const customActions = useMindMapStore((s) => s.customActions)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { nodeId: string; x: number; y: number }
      setNodeId(detail.nodeId)
      setPosition({ x: detail.x, y: detail.y })
      setVisible(true)
    }
    window.addEventListener('mindmap-node-contextmenu', handler)
    return () => window.removeEventListener('mindmap-node-contextmenu', handler)
  }, [])

  useEffect(() => {
    if (!visible) return
    const close = () => setVisible(false)
    window.addEventListener('click', close)
    window.addEventListener('contextmenu', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('contextmenu', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [visible])

  const handleAction = useCallback(
    (action: AIAction) => {
      if (!nodeId || !hasApiKey) return
      setVisible(false)
      performAIAction(action, nodeId)
    },
    [nodeId, hasApiKey, performAIAction],
  )

  const handleCustomAction = useCallback(
    (action: CustomAction) => {
      if (!nodeId || !hasApiKey) return
      setVisible(false)
      performCustomAction(action, nodeId)
    },
    [nodeId, hasApiKey, performCustomAction],
  )

  const handleAddChild = useCallback(() => {
    if (!nodeId) return
    setVisible(false)
    addChild(nodeId, t('新节点', 'New Node', language))
  }, [nodeId, addChild, language])

  const handleAddSibling = useCallback(() => {
    if (!nodeId) return
    setVisible(false)
    addSibling(nodeId, t('新节点', 'New Node', language))
  }, [nodeId, addSibling, language])

  const handleDelete = useCallback(() => {
    if (!nodeId) return
    setVisible(false)
    deleteNode(nodeId)
  }, [nodeId, deleteNode])

  const handleToggle = useCallback(() => {
    if (!nodeId) return
    setVisible(false)
    toggleCollapse(nodeId)
  }, [nodeId, toggleCollapse])

  const handleSetColor = useCallback(
    (color: string | null) => {
      if (!nodeId) return
      setNodeColor(nodeId, color)
    },
    [nodeId, setNodeColor],
  )

  const setNodeAttachment = useMindMapStore((s) => s.setNodeAttachment)
  const currentNode = nodeId ? findNodeById(root, nodeId) : null

  const handleAddImage = useCallback(() => {
    if (!nodeId) return
    const url = window.prompt(t('输入图片 URL', 'Enter image URL', language))
    if (url) {
      setNodeAttachment(nodeId, { ...currentNode?.payload?.attachment, imageUrl: url })
    }
    setVisible(false)
  }, [nodeId, language, currentNode, setNodeAttachment])

  const handleAddLink = useCallback(() => {
    if (!nodeId) return
    const url = window.prompt(t('输入链接 URL', 'Enter link URL', language))
    if (url) {
      setNodeAttachment(nodeId, { ...currentNode?.payload?.attachment, linkUrl: url })
    }
    setVisible(false)
  }, [nodeId, language, currentNode, setNodeAttachment])

  const handleAddNote = useCallback(() => {
    if (!nodeId) return
    const note = window.prompt(t('输入备注', 'Enter note', language), currentNode?.payload?.attachment?.note ?? '')
    if (note !== null) {
      setNodeAttachment(nodeId, { ...currentNode?.payload?.attachment, note })
    }
    setVisible(false)
  }, [nodeId, language, currentNode, setNodeAttachment])

  const NODE_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  ]

  if (!visible || !nodeId) return null

  return (
    <div
      className="fixed z-[100] min-w-[220px] py-1.5 bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-2xl backdrop-blur-md"
      style={{
        left: Math.min(position.x, window.innerWidth - 240),
        top: Math.min(position.y, window.innerHeight - 400),
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      role="menu"
      aria-label={t('节点操作菜单', 'Node actions menu', language)}
    >
      <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        {t('AI 操作', 'AI Actions', language)}
      </div>
      {!hasApiKey && (
        <div className="mx-2 mb-1 px-2 py-1.5 flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
          <AlertTriangle size={12} className="shrink-0" />
          {t('请先在设置中配置 API Key', 'Please configure API Key in Settings', language)}
        </div>
      )}
      {AI_ACTIONS.map((action) => {
        const Icon = ICON_MAP[action.icon]
        return (
          <button
            key={action.key}
            className="w-full flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:pointer-events-none text-left"
            onClick={() => handleAction(action.key)}
            disabled={isGenerating || !hasApiKey}
            role="menuitem"
          >
            {Icon && <Icon size={15} className="shrink-0" />}
            <div>
              <div className="font-medium text-[13px]">{language === 'zh' ? action.label : action.labelEn}</div>
              <div className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
                {language === 'zh' ? action.description : action.descriptionEn}
              </div>
            </div>
          </button>
        )
      })}
      {customActions.length > 0 && (
        <>
          <div className="my-1 mx-2 border-t border-gray-100 dark:border-gray-800" />
          <div className="px-3 py-1.5 text-[11px] font-semibold text-purple-400 dark:text-purple-500 uppercase tracking-widest">
            {t('自定义动作', 'Custom Actions', language)}
          </div>
          {customActions.map((action) => (
            <button
              key={action.id}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 transition-colors disabled:opacity-50 disabled:pointer-events-none text-left"
              onClick={() => handleCustomAction(action)}
              disabled={isGenerating || !hasApiKey}
              role="menuitem"
            >
              <span className="shrink-0 text-sm">{action.icon}</span>
              <div>
                <div className="font-medium text-[13px]">{action.name}</div>
              </div>
            </button>
          ))}
        </>
      )}

      <div className="my-1 mx-2 border-t border-gray-100 dark:border-gray-800" />

      <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        {t('编辑', 'Edit', language)}
      </div>
      <button
        className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
        onClick={handleAddChild}
        role="menuitem"
      >
        <GitBranch size={15} className="shrink-0" />
        <span>{t('添加子节点', 'Add Child', language)}</span>
        <kbd className="ml-auto text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">Tab</kbd>
      </button>
      <button
        className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
        onClick={handleAddSibling}
        role="menuitem"
      >
        <ChevronRight size={15} className="shrink-0" />
        <span>{t('添加兄弟节点', 'Add Sibling', language)}</span>
        <kbd className="ml-auto text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">Enter</kbd>
      </button>
      <button
        className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
        onClick={handleToggle}
        role="menuitem"
      >
        <Minimize2 size={15} className="shrink-0" />
        <span>{t('折叠/展开', 'Collapse / Expand', language)}</span>
        <kbd className="ml-auto text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">Space</kbd>
      </button>
      <button
        className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
        onClick={handleDelete}
        role="menuitem"
      >
        <Trash2 size={15} className="shrink-0" />
        <span>{t('删除', 'Delete', language)}</span>
        <kbd className="ml-auto text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">Del</kbd>
      </button>
      {selectedNodeIds.size > 1 && (
        <button
          className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
          onClick={() => { deleteSelectedNodes(); setVisible(false) }}
          role="menuitem"
        >
          <Trash2 size={15} className="shrink-0" />
          <span>{t(`删除选中 (${selectedNodeIds.size})`, `Delete Selected (${selectedNodeIds.size})`, language)}</span>
        </button>
      )}

      <div className="my-1 mx-2 border-t border-gray-100 dark:border-gray-800" />

      <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        {t('附件', 'Attachments', language)}
      </div>
      <button
        className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
        onClick={handleAddImage}
        role="menuitem"
      >
        <Image size={15} className="shrink-0" />
        <span>{t('添加图片', 'Add Image', language)}</span>
      </button>
      <button
        className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
        onClick={handleAddLink}
        role="menuitem"
      >
        <Link2 size={15} className="shrink-0" />
        <span>{t('添加链接', 'Add Link', language)}</span>
      </button>
      <button
        className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
        onClick={handleAddNote}
        role="menuitem"
      >
        <FileText size={15} className="shrink-0" />
        <span>{t('添加备注', 'Add Note', language)}</span>
      </button>
      {currentNode?.payload?.attachment && (
        <div className="mx-2 my-1 px-2 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-[11px] space-y-1">
          {currentNode.payload.attachment.imageUrl && (
            <div className="flex items-center gap-1 text-blue-500 truncate">
              <Image size={11} /> {t('图片', 'Image', language)}
            </div>
          )}
          {currentNode.payload.attachment.linkUrl && (
            <div className="flex items-center gap-1 text-blue-500 truncate">
              <Link2 size={11} /> {t('链接', 'Link', language)}
            </div>
          )}
          {currentNode.payload.attachment.note && (
            <div className="flex items-center gap-1 text-gray-500 truncate">
              <FileText size={11} /> {currentNode.payload.attachment.note.slice(0, 30)}
            </div>
          )}
        </div>
      )}

      <div className="my-1 mx-2 border-t border-gray-100 dark:border-gray-800" />

      <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        {t('颜色', 'Color', language)}
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        <Palette size={13} className="shrink-0 text-gray-400" />
        {NODE_COLORS.map((color) => (
          <button
            key={color}
            className="w-5 h-5 rounded-full border-2 transition-all hover:scale-125"
            style={{
              backgroundColor: color,
              borderColor: currentNode?.payload?.color === color ? '#6366f1' : 'transparent',
            }}
            onClick={() => handleSetColor(color)}
            aria-label={color}
          />
        ))}
        {currentNode?.payload?.color && (
          <button
            className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-gradient-to-br from-white to-gray-100 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center hover:scale-125 transition-all"
            onClick={() => handleSetColor(null)}
            aria-label={t('清除颜色', 'Clear color', language)}
          >
            <span className="text-[8px] text-gray-400">✕</span>
          </button>
        )}
      </div>
    </div>
  )
}
