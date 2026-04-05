import { Component, type ReactNode, useState, useCallback, useEffect } from 'react'
import { MindMapCanvas } from '@/components/MindMap/MindMapCanvas'
import { Toolbar } from '@/components/Toolbar/Toolbar'
import { NodeContextMenu } from '@/components/NodeActions/NodeContextMenu'
import { SettingsDialog } from '@/components/Settings/SettingsDialog'
import { SearchPanel } from '@/components/MindMap/SearchPanel'
import { SessionHistory } from '@/components/MindMap/SessionHistory'
import { TemplateGallery } from '@/components/MindMap/TemplateGallery'
import { useExport } from '@/components/Settings/useExport'
import { useKeyboardShortcuts } from '@/components/Toolbar/useKeyboardShortcuts'
import { useMindMapStore } from '@/store/mindmapStore'
import { MarkmapProvider } from '@/hooks/useMarkmap'
import { useMarkmapContext } from '@/hooks/markmapContext'
import { hasShareData, loadShareData } from '@/utils/share'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex items-center justify-center bg-white dark:bg-gray-950 p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="text-4xl select-none">Oops</div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {this.state.error?.message || 'Something went wrong'}
            </h2>
            <button
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AppContent() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [sessionHistoryOpen, setSessionHistoryOpen] = useState(false)
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false)
  const language = useMindMapStore((s) => s.settings.language)
  const error = useMindMapStore((s) => s.error)
  const clearError = useMindMapStore((s) => s.clearError)
  const loadFromLocalStorage = useMindMapStore((s) => s.loadFromLocalStorage)
  const loadCustomActions = useMindMapStore((s) => s.loadCustomActions)
  const loadMindmap = useMindMapStore((s) => s.loadMindmap)

  useKeyboardShortcuts()

  const { svgRef } = useMarkmapContext()
  const { exportMarkdown, exportPng, exportSvg } = useExport(svgRef)

  useEffect(() => {
    loadFromLocalStorage()
    loadCustomActions()
    if (hasShareData()) {
      const data = loadShareData()
      if (data) loadMindmap(data)
    }
  }, [loadFromLocalStorage, loadCustomActions, loadMindmap])

  useEffect(() => {
    const handler = () => setSearchOpen(true)
    window.addEventListener('fightbrain:open-search', handler)
    return () => window.removeEventListener('fightbrain:open-search', handler)
  }, [])

  const handleExport = useCallback(
    (format: 'markdown' | 'svg' | 'png') => {
      if (format === 'markdown') exportMarkdown()
      else if (format === 'png') exportPng()
      else if (format === 'svg') exportSvg()
    },
    [exportMarkdown, exportPng, exportSvg],
  )

  return (
    <div className="w-screen h-screen overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Toolbar
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenSessionHistory={() => setSessionHistoryOpen(true)}
        onOpenTemplateGallery={() => setTemplateGalleryOpen(true)}
        onExport={handleExport}
      />
      <MindMapCanvas />
      <NodeContextMenu />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SessionHistory open={sessionHistoryOpen} onClose={() => setSessionHistoryOpen(false)} />
      <TemplateGallery open={templateGalleryOpen} onClose={() => setTemplateGalleryOpen(false)} />

      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 rounded-xl shadow-lg backdrop-blur-sm max-w-md">
          <span className="text-sm flex-1">{error}</span>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
          >
            {language === 'zh' ? '关闭' : 'Dismiss'}
          </button>
        </div>
      )}

      <div className="hidden sm:block absolute bottom-4 left-4 text-xs text-gray-300 dark:text-gray-700 select-none pointer-events-none">
        {language === 'zh'
          ? '双击节点编辑 · 右键 AI 操作 · 滚轮缩放 · 拖拽平移 · 长按拖拽节点'
          : 'Double-click to edit · Right-click for AI · Scroll to zoom · Drag to pan · Long-press drag nodes'}
      </div>
      <div className="sm:hidden absolute bottom-4 left-4 text-xs text-gray-300 dark:text-gray-700 select-none pointer-events-none">
        {language === 'zh'
          ? '双击编辑 · 长按拖拽 · 双指缩放'
          : 'Dbl-click edit · Long-press drag · Pinch zoom'}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <MarkmapProvider>
        <AppContent />
      </MarkmapProvider>
    </ErrorBoundary>
  )
}
