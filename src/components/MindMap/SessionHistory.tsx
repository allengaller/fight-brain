import { useCallback, useMemo, useState } from 'react'
import { X, Clock, Trash2, RotateCcw } from 'lucide-react'
import { STORAGE_KEYS } from '@/constants'
import { useMindMapStore } from '@/store/mindmapStore'
import type { MindMapNode } from '@/types'

interface Session {
  id: string
  name: string
  timestamp: number
  root: MindMapNode
}

const t = (zh: string, en: string, lang: 'zh' | 'en') => (lang === 'zh' ? zh : en)

const MAX_SESSIONS = 20

function readSessions(): Session[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS)
    if (stored) return JSON.parse(stored) as Session[]
  } catch {
    // ignore
  }
  return []
}

function writeSessions(sessions: Session[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions.slice(0, MAX_SESSIONS)))
  } catch {
    // ignore
  }
}

interface SessionHistoryProps {
  open: boolean
  onClose: () => void
}

export function SessionHistory({ open, onClose }: SessionHistoryProps) {
  const [version, setVersion] = useState(0)
  const language = useMindMapStore((s) => s.settings.language)
  const root = useMindMapStore((s) => s.root)
  const loadMindmap = useMindMapStore((s) => s.loadMindmap)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sessions = useMemo(() => readSessions(), [open, version])

  const handleSave = useCallback(() => {
    const currentSessions = readSessions()
    const session: Session = {
      id: crypto.randomUUID(),
      name: root.content,
      timestamp: Date.now(),
      root: structuredClone(root),
    }
    writeSessions([session, ...currentSessions])
    setVersion(v => v + 1)
  }, [root])

  const handleRestore = useCallback(
    (session: Session) => {
      loadMindmap(session.root)
      onClose()
    },
    [loadMindmap, onClose],
  )

  const handleDelete = useCallback(
    (id: string) => {
      const currentSessions = readSessions()
      writeSessions(currentSessions.filter(s => s.id !== id))
      setVersion(v => v + 1)
    },
    [],
  )

  const handleClearAll = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSIONS)
    } catch {
      // ignore
    }
    setVersion(v => v + 1)
  }, [])

  void version

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={t('会话历史', 'Session History', language)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Clock size={16} className="text-indigo-500" />
            {t('会话历史', 'Session History', language)}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label={t('关闭', 'Close', language)}>
            <X size={18} />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <button
            onClick={handleSave}
            className="w-full mb-4 px-4 py-2.5 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            {t('保存当前脑图', 'Save Current Mind Map', language)}
          </button>

          {sessions.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              {t('暂无保存的会话', 'No saved sessions', language)}
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg group"
                >
                  <button
                    className="flex-1 text-left min-w-0"
                    onClick={() => handleRestore(session)}
                    title={t('点击恢复', 'Click to restore', language)}
                  >
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {session.name}
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500">
                      {new Date(session.timestamp).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
                    </div>
                  </button>
                  <button
                    className="p-1 text-gray-400 hover:text-indigo-500 rounded opacity-0 group-hover:opacity-100 transition-all"
                    onClick={() => handleRestore(session)}
                    title={t('恢复', 'Restore', language)}
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    className="p-1 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all"
                    onClick={() => handleDelete(session.id)}
                    title={t('删除', 'Delete', language)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={handleClearAll}
                className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                {t('清除所有会话', 'Clear All Sessions', language)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
