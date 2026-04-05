import { useEffect, useCallback } from 'react'
import { useMindMapStore } from '@/store/mindmapStore'

const t = (zh: string, en: string, lang: 'zh' | 'en') => (lang === 'zh' ? zh : en)

export function useKeyboardShortcuts() {
  const selectNode = useMindMapStore((s) => s.selectNode)
  const undo = useMindMapStore((s) => s.undo)
  const redo = useMindMapStore((s) => s.redo)
  const deleteNode = useMindMapStore((s) => s.deleteNode)
  const addChild = useMindMapStore((s) => s.addChild)
  const addSibling = useMindMapStore((s) => s.addSibling)
  const selectedNodeId = useMindMapStore((s) => s.selectedNodeId)
  const toggleCollapse = useMindMapStore((s) => s.toggleCollapse)
  const isGenerating = useMindMapStore((s) => s.isGenerating)
  const language = useMindMapStore((s) => s.settings.language)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if (isInput) return
      if (isGenerating) return

      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }

      if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
        return
      }

      if (mod && e.key === 'Z') {
        e.preventDefault()
        redo()
        return
      }

      if (mod && e.key === 'f') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('fightbrain:open-search'))
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault()
          deleteNode(selectedNodeId)
        }
        return
      }

      if (e.key === 'Tab') {
        if (selectedNodeId) {
          e.preventDefault()
          addChild(selectedNodeId, t('新节点', 'New Node', language))
        }
        return
      }

      if (e.key === 'Enter') {
        if (selectedNodeId) {
          e.preventDefault()
          addSibling(selectedNodeId, t('新节点', 'New Node', language))
        }
        return
      }

      if (e.key === ' ') {
        if (selectedNodeId) {
          e.preventDefault()
          toggleCollapse(selectedNodeId)
        }
        return
      }

      if (e.key === 'Escape') {
        selectNode(null)
        return
      }
    },
    [selectedNodeId, undo, redo, deleteNode, addChild, addSibling, toggleCollapse, selectNode, isGenerating, language],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
