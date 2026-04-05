import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useMindMapStore } from '@/store/mindmapStore'
import { collectAllNodes } from '@/utils/treeUtils'
import type { MindMapNode } from '@/types'

export function SearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [prevOpen, setPrevOpen] = useState(false)
  const root = useMindMapStore((s) => s.root)
  const selectNode = useMindMapStore((s) => s.selectNode)
  const language = useMindMapStore((s) => s.settings.language)

  if (open && !prevOpen) {
    setQuery('')
    setPrevOpen(true)
  } else if (!open && prevOpen) {
    setPrevOpen(false)
  }

  const results = useMemo(() => {
    if (!query.trim()) return []
    const lower = query.toLowerCase()
    const all = collectAllNodes(root)
    return all.filter(n => n.content.toLowerCase().includes(lower))
  }, [query, root])

  const handleSelect = useCallback(
    (node: MindMapNode) => {
      selectNode(node.id)
      onClose()
    },
    [selectNode, onClose],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        handleSelect(results[selectedIndex])
      } else if (e.key === 'Escape') {
        onClose()
      }
    },
    [results, selectedIndex, handleSelect, onClose],
  )

  useEffect(() => {
    if (!open) return
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
      <div className="bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'zh' ? '搜索节点...' : 'Search nodes...'}
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        {results.length > 0 && (
          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            {results.map((node, i) => (
              <li
                key={node.id}
                className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                  i === selectedIndex
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => handleSelect(node)}
                role="option"
                aria-selected={i === selectedIndex}
              >
                {node.content}
              </li>
            ))}
          </ul>
        )}
        {query && results.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            {language === 'zh' ? '没有找到匹配的节点' : 'No matching nodes found'}
          </div>
        )}
      </div>
    </div>
  )
}
