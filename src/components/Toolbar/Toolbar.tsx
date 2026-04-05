import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Undo2,
  Redo2,
  Settings,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize,
  Plus,
  Sparkles,
  FileText,
  FileJson,
  FileUp,
  Trash2,
  Search,
  X,
  Menu,
  History,
  Link2,
} from 'lucide-react'
import { useMindMapStore } from '@/store/mindmapStore'
import { useMarkmapContext } from '@/hooks/markmapContext'
import { generateShareURL } from '@/utils/share'

const t = (zh: string, en: string, lang: 'zh' | 'en') => (lang === 'zh' ? zh : en)

interface ToolbarProps {
  onOpenSettings: () => void
  onOpenSearch: () => void
  onOpenSessionHistory: () => void
  onOpenTemplateGallery: () => void
  onExport: (format: 'markdown' | 'svg' | 'png') => void
}

export function Toolbar({ onOpenSettings, onOpenSearch, onOpenSessionHistory, onOpenTemplateGallery, onExport }: ToolbarProps) {
  const selectedNodeId = useMindMapStore((s) => s.selectedNodeId)
  const isGenerating = useMindMapStore((s) => s.isGenerating)
  const hasApiKey = !!useMindMapStore((s) => s.settings.llm.apiKey)
  const canUndo = useMindMapStore((s) => s.canUndo())
  const canRedo = useMindMapStore((s) => s.canRedo())
  const undo = useMindMapStore((s) => s.undo)
  const redo = useMindMapStore((s) => s.redo)
  const addChild = useMindMapStore((s) => s.addChild)
  const performAIAction = useMindMapStore((s) => s.performAIAction)
  const resetMindmap = useMindMapStore((s) => s.resetMindmap)
  const exportAsJSON = useMindMapStore((s) => s.exportAsJSON)
  const importFromJSON = useMindMapStore((s) => s.importFromJSON)
  const language = useMindMapStore((s) => s.settings.language)

  const { fit, rescale } = useMarkmapContext()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showExport, setShowExport] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleQuickExpand = useCallback(() => {
    if (selectedNodeId && !isGenerating && hasApiKey) {
      performAIAction('expand', selectedNodeId)
    }
  }, [selectedNodeId, isGenerating, hasApiKey, performAIAction])

  const handleAddChild = useCallback(() => {
    if (selectedNodeId) {
      addChild(selectedNodeId, t('新节点', 'New Node', language))
    }
  }, [selectedNodeId, addChild, language])

  const handleExportJSON = useCallback(() => {
    const json = exportAsJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fightbrain-export.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setShowExport(false)
  }, [exportAsJSON])

  const handleImportJSON = useCallback(() => {
    fileInputRef.current?.click()
    setShowExport(false)
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      importFromJSON(reader.result as string)
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [importFromJSON])

  const handleReset = useCallback(() => {
    resetMindmap()
    setShowExport(false)
  }, [resetMindmap])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const close = () => setMobileMenuOpen(false)
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [mobileMenuOpen])

  return (
    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
      <div className="flex items-center justify-between px-2 sm:px-4 py-2">
        <div className="flex items-center gap-1 pointer-events-auto">
          <div className="hidden sm:flex items-center gap-1 px-2 py-1.5 bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-sm backdrop-blur-md">
            <h1 className="text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mr-2">
              FightBrain
            </h1>
            <Separator />
            <ToolbarButton icon={Undo2} tooltip={t('撤销 (Ctrl+Z)', 'Undo (Ctrl+Z)', language)} onClick={undo} disabled={!canUndo} />
            <ToolbarButton icon={Redo2} tooltip={t('重做 (Ctrl+Shift+Z)', 'Redo (Ctrl+Shift+Z)', language)} onClick={redo} disabled={!canRedo} />
            <Separator />
            <ToolbarButton icon={Plus} tooltip={t('添加子节点 (Tab)', 'Add Child (Tab)', language)} onClick={handleAddChild} disabled={!selectedNodeId} />
            <ToolbarButton
              icon={Sparkles}
              tooltip={hasApiKey ? t('AI 展开', 'AI Expand', language) : t('请先配置 API Key', 'Set API Key first', language)}
              onClick={handleQuickExpand}
              disabled={!selectedNodeId || isGenerating || !hasApiKey}
              active
            />
          </div>
          <div className="sm:hidden flex items-center gap-1 px-2 py-1.5 bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-sm backdrop-blur-md">
            <h1 className="text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mr-1">
              FB
            </h1>
            <Separator />
            <ToolbarButton icon={Undo2} tooltip={t('撤销', 'Undo', language)} onClick={undo} disabled={!canUndo} />
            <ToolbarButton icon={Redo2} tooltip={t('重做', 'Redo', language)} onClick={redo} disabled={!canRedo} />
            <ToolbarButton icon={Plus} tooltip={t('添加子节点', 'Add Child', language)} onClick={handleAddChild} disabled={!selectedNodeId} />
            <ToolbarButton
              icon={Sparkles}
              tooltip={hasApiKey ? t('AI 展开', 'AI Expand', language) : t('请先配置 API Key', 'Set API Key first', language)}
              onClick={handleQuickExpand}
              disabled={!selectedNodeId || isGenerating || !hasApiKey}
              active
            />
          </div>
        </div>

        <div className="flex items-center gap-1 pointer-events-auto">
          <div className="hidden sm:flex items-center gap-1 px-2 py-1.5 bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-sm backdrop-blur-md">
            <ToolbarButton icon={ZoomOut} tooltip={t('缩小', 'Zoom Out', language)} onClick={() => rescale(0.8)} />
            <ToolbarButton icon={Maximize} tooltip={t('适应视图', 'Fit View', language)} onClick={fit} />
            <ToolbarButton icon={ZoomIn} tooltip={t('放大', 'Zoom In', language)} onClick={() => rescale(1.25)} />
            <Separator />
            <ToolbarButton icon={Search} tooltip={t('搜索 (Ctrl+F)', 'Search (Ctrl+F)', language)} onClick={onOpenSearch} />
            <ToolbarButton icon={History} tooltip={t('会话历史', 'Sessions', language)} onClick={onOpenSessionHistory} />
            <Separator />
            <div className="relative">
              <ToolbarButton icon={Download} tooltip={t('导出/导入', 'Export / Import', language)} onClick={() => setShowExport(!showExport)} />
              {showExport && (
                <div
                  className="absolute right-0 top-full mt-1 w-48 py-1 bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-xl backdrop-blur-md z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownItem icon={FileText} label={t('导出 Markdown', 'Export Markdown', language)} onClick={() => { onExport('markdown'); setShowExport(false) }} />
                  <DropdownItem icon={FileText} label={t('导出 PNG', 'Export PNG', language)} onClick={() => { onExport('png'); setShowExport(false) }} />
                  <DropdownItem icon={FileText} label={t('导出 SVG', 'Export SVG', language)} onClick={() => { onExport('svg'); setShowExport(false) }} />
                  <DropdownItem icon={FileJson} label={t('导出 JSON', 'Export JSON', language)} onClick={handleExportJSON} />
                  <DropdownItem icon={FileUp} label={t('导入 JSON', 'Import JSON', language)} onClick={handleImportJSON} />
                  <DropdownItem icon={Link2} label={t('复制分享链接', 'Copy Share Link', language)} onClick={() => { navigator.clipboard.writeText(generateShareURL(useMindMapStore.getState().root)); setShowExport(false) }} />
                  <div className="my-1 mx-2 border-t border-gray-100 dark:border-gray-800" />
                  <DropdownItem icon={Trash2} label={t('新建脑图', 'New Mind Map', language)} onClick={() => { resetMindmap(); setShowExport(false) }} destructive />
                  <DropdownItem icon={FileUp} label={t('从模板新建', 'New from Template', language)} onClick={() => { onOpenTemplateGallery(); setShowExport(false) }} />
                </div>
              )}
            </div>
            <ToolbarButton icon={Settings} tooltip={t('设置', 'Settings', language)} onClick={onOpenSettings} />
          </div>
          <div className="sm:hidden flex items-center gap-1 px-2 py-1.5 bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-sm backdrop-blur-md">
            <ToolbarButton icon={Search} tooltip={t('搜索', 'Search', language)} onClick={onOpenSearch} />
            <div className="relative">
              <ToolbarButton
                icon={mobileMenuOpen ? X : Menu}
                tooltip={t('更多', 'More', language)}
                onClick={() => { setShowExport(false); setMobileMenuOpen(!mobileMenuOpen) }}
              />
              {mobileMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-52 py-1 bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-xl backdrop-blur-md z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownItem icon={ZoomOut} label={t('缩小', 'Zoom Out', language)} onClick={() => { rescale(0.8); setMobileMenuOpen(false) }} />
                  <DropdownItem icon={Maximize} label={t('适应视图', 'Fit View', language)} onClick={() => { fit(); setMobileMenuOpen(false) }} />
                  <DropdownItem icon={ZoomIn} label={t('放大', 'Zoom In', language)} onClick={() => { rescale(1.25); setMobileMenuOpen(false) }} />
                  <div className="my-1 mx-2 border-t border-gray-100 dark:border-gray-800" />
                  <DropdownItem icon={FileText} label={t('导出 Markdown', 'Export Markdown', language)} onClick={() => { onExport('markdown'); setMobileMenuOpen(false) }} />
                  <DropdownItem icon={FileText} label={t('导出 PNG', 'Export PNG', language)} onClick={() => { onExport('png'); setMobileMenuOpen(false) }} />
                  <DropdownItem icon={FileText} label={t('导出 SVG', 'Export SVG', language)} onClick={() => { onExport('svg'); setMobileMenuOpen(false) }} />
                  <DropdownItem icon={FileJson} label={t('导出 JSON', 'Export JSON', language)} onClick={() => { handleExportJSON(); setMobileMenuOpen(false) }} />
                  <DropdownItem icon={FileUp} label={t('导入 JSON', 'Import JSON', language)} onClick={() => { handleImportJSON(); setMobileMenuOpen(false) }} />
                  <div className="my-1 mx-2 border-t border-gray-100 dark:border-gray-800" />
                  <DropdownItem icon={Settings} label={t('设置', 'Settings', language)} onClick={() => { onOpenSettings(); setMobileMenuOpen(false) }} />
                  <DropdownItem icon={Trash2} label={t('新建脑图', 'New Mind Map', language)} onClick={() => { handleReset(); setMobileMenuOpen(false) }} destructive />
                </div>
              )}
            </div>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  )
}

function DropdownItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[13px] transition-colors text-left ${
        destructive
          ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      onClick={onClick}
    >
      <Icon size={14} className="shrink-0" />
      <span>{label}</span>
    </button>
  )
}

function ToolbarButton({
  icon: Icon,
  tooltip,
  onClick,
  disabled,
  active,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  tooltip: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      className={`p-1.5 rounded-md transition-colors ${
        disabled
          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          : active
            ? 'text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      aria-label={tooltip}
    >
      <Icon size={16} />
    </button>
  )
}

function Separator() {
  return <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
}
