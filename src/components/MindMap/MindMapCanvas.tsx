import { useCallback, useEffect, useRef, useState } from 'react'
import { Square } from 'lucide-react'
import { useMindMapStore } from '@/store/mindmapStore'
import { useMarkmapContext } from '@/hooks/markmapContext'

interface DragState {
  isDragging: boolean
  nodeId: string | null
  ghostEl: HTMLDivElement | null
  startX: number
  startY: number
}

export function MindMapCanvas() {
  const { svgRef } = useMarkmapContext()
  const [isEditing, setIsEditing] = useState(false)
  const [editNodeId, setEditNodeId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editPosition, setEditPosition] = useState({ x: 0, y: 0 })
  const editInputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<DragState>({ isDragging: false, nodeId: null, ghostEl: null, startX: 0, startY: 0 })
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)

  const selectNode = useMindMapStore((s) => s.selectNode)
  const addToSelection = useMindMapStore((s) => s.addToSelection)
  const updateContent = useMindMapStore((s) => s.updateContent)
  const moveNode = useMindMapStore((s) => s.moveNode)
  const isGenerating = useMindMapStore((s) => s.isGenerating)
  const streamingText = useMindMapStore((s) => s.streamingText)
  const cancelGeneration = useMindMapStore((s) => s.cancelGeneration)
  const root = useMindMapStore((s) => s.root)
  const language = useMindMapStore((s) => s.settings.language)

  const isNew = root.content === 'New Idea' && root.children.length === 0

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isEditing) return
      if (longPressTriggered.current) {
        longPressTriggered.current = false
        return
      }

      const target = (e.target as Element).closest('.markmap-node')
      if (!target) {
        selectNode(null)
        return
      }

      const gElement = target.closest('g.markmap-node') as SVGGElement | null
      if (gElement) {
        const nodeId = gElement.dataset.nodeId
        if (nodeId) {
          if (e.shiftKey) {
            addToSelection(nodeId)
          } else {
            selectNode(nodeId)
          }
        }
      }
    },
    [selectNode, addToSelection, isEditing],
  )

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const handleDblClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest('.markmap-node')
      if (!target) return

      const gElement = target.closest('g.markmap-node') as SVGGElement | null
      if (!gElement) return

      const nodeId = gElement.dataset.nodeId
      if (!nodeId) return

      const foreignObject = gElement.querySelector('foreignObject')
      if (!foreignObject) return

      const rect = foreignObject.getBoundingClientRect()
      setEditNodeId(nodeId)
      setEditContent(foreignObject.textContent ?? '')
      setEditPosition({
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
      })
      setIsEditing(true)

      requestAnimationFrame(() => {
        editInputRef.current?.focus()
        editInputRef.current?.select()
      })
    }

    svg.addEventListener('dblclick', handleDblClick, true)
    return () => svg.removeEventListener('dblclick', handleDblClick, true)
  }, [svgRef])

  const commitEdit = useCallback(() => {
    if (editNodeId && editContent.trim()) {
      updateContent(editNodeId, editContent.trim())
    }
    setIsEditing(false)
    setEditNodeId(null)
  }, [editNodeId, editContent, updateContent])

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        commitEdit()
      }
      if (e.key === 'Escape') {
        setIsEditing(false)
        setEditNodeId(null)
      }
    },
    [commitEdit],
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (longPressTriggered.current) {
        longPressTriggered.current = false
        e.preventDefault()
        return
      }
      const target = (e.target as Element).closest('.markmap-node')
      if (!target) return

      const gElement = target.closest('g.markmap-node') as SVGGElement | null
      if (gElement) {
        const nodeId = gElement.dataset.nodeId
        if (nodeId) {
          selectNode(nodeId)
          const event = new CustomEvent('mindmap-node-contextmenu', {
            detail: { nodeId, x: e.clientX, y: e.clientY },
          })
          window.dispatchEvent(event)
          e.preventDefault()
        }
      }
    },
    [selectNode],
  )

  const getNodeFromPoint = useCallback((clientX: number, clientY: number): SVGGElement | null => {
    const svg = svgRef.current
    if (!svg) return null
    const el = document.elementFromPoint(clientX, clientY)
    if (!el) return null
    const g = (el as Element).closest('g.markmap-node') as SVGGElement | null
    return g
  }, [svgRef])

  const cleanupDrag = useCallback(() => {
    if (dragRef.current.ghostEl) {
      dragRef.current.ghostEl.remove()
      dragRef.current.ghostEl = null
    }
    dragRef.current.isDragging = false
    dragRef.current.nodeId = null
    document.body.style.userSelect = ''
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    longPressTriggered.current = false
  }, [])

  const startDrag = useCallback(
    (nodeId: string, clientX: number, clientY: number) => {
      const gElement = svgRef.current?.querySelector<SVGGElement>(`g.markmap-node[data-node-id="${nodeId}"]`)
      if (!gElement) return

      const fo = gElement.querySelector('foreignObject')
      if (!fo) return
      const rect = fo.getBoundingClientRect()

      const ghost = document.createElement('div')
      ghost.textContent = fo.textContent ?? ''
      ghost.className = 'fixed pointer-events-none z-[200] px-3 py-1.5 text-sm font-medium rounded-lg shadow-2xl border-2 border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 opacity-90'
      ghost.style.left = `${rect.left}px`
      ghost.style.top = `${rect.top}px`
      ghost.style.width = `${rect.width}px`
      ghost.style.maxWidth = '300px'
      ghost.style.whiteSpace = 'nowrap'
      ghost.style.overflow = 'hidden'
      ghost.style.textOverflow = 'ellipsis'
      document.body.appendChild(ghost)

      dragRef.current = {
        isDragging: true,
        nodeId,
        ghostEl: ghost,
        startX: clientX,
        startY: clientY,
      }
      document.body.style.userSelect = 'none'
    },
    [svgRef],
  )

  const endDrag = useCallback(() => {
    if (!dragRef.current.isDragging) return

    const { ghostEl } = dragRef.current
    if (ghostEl) {
      ghostEl.remove()
    }
    document.body.style.userSelect = ''

    const dropTarget = getNodeFromPoint(
      dragRef.current.startX,
      dragRef.current.startY,
    )

    if (dropTarget) {
      const targetNodeId = dropTarget.dataset.nodeId
      if (targetNodeId && dragRef.current.nodeId && targetNodeId !== dragRef.current.nodeId) {
        moveNode(dragRef.current.nodeId, targetNodeId)
      }
    }

    dragRef.current.isDragging = false
    dragRef.current.nodeId = null
    dragRef.current.ghostEl = null
    longPressTriggered.current = false
  }, [getNodeFromPoint, moveNode])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const handlePointerDown = (e: PointerEvent) => {
      const target = (e.target as Element).closest('.markmap-node')
      if (!target) return

      const gElement = target.closest('g.markmap-node') as SVGGElement | null
      if (!gElement) return

      const nodeId = gElement.dataset.nodeId
      if (!nodeId) return

      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true
        startDrag(nodeId, e.clientX, e.clientY)
      }, 400)
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragRef.current.isDragging || !dragRef.current.ghostEl) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      dragRef.current.ghostEl.style.transform = `translate(${dx}px, ${dy}px) scale(0.95)`
    }

    const handlePointerUp = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      if (dragRef.current.isDragging) {
        endDrag()
      }
    }

    const handlePointerCancel = () => {
      cleanupDrag()
    }

    svg.addEventListener('pointerdown', handlePointerDown)
    svg.addEventListener('pointermove', handlePointerMove)
    svg.addEventListener('pointerup', handlePointerUp)
    svg.addEventListener('pointercancel', handlePointerCancel)
    return () => {
      svg.removeEventListener('pointerdown', handlePointerDown)
      svg.removeEventListener('pointermove', handlePointerMove)
      svg.removeEventListener('pointerup', handlePointerUp)
      svg.removeEventListener('pointercancel', handlePointerCancel)
    }
  }, [svgRef, startDrag, endDrag, cleanupDrag])

  return (
    <div className="relative w-full h-full overflow-hidden bg-white dark:bg-gray-950">
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{ touchAction: 'none' }}
      />
      {isEditing && (
        <input
          ref={editInputRef}
          type="text"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleEditKeyDown}
          className="fixed z-50 px-2 py-1 text-sm font-medium bg-white dark:bg-gray-800 border-2 border-indigo-500 rounded shadow-lg outline-none"
          style={{
            left: editPosition.x - 4,
            top: editPosition.y - 4,
            minWidth: 100,
          }}
        />
      )}
      {isGenerating && (
        <div className="absolute top-4 right-4 z-40 max-w-xs w-72">
          <div className="px-4 py-3 bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <LoadingSpinner />
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {language === 'zh' ? 'AI 正在思考...' : 'AI is thinking...'}
                </span>
              </div>
              <button
                onClick={cancelGeneration}
                className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                title={language === 'zh' ? '取消' : 'Cancel'}
              >
                <Square size={12} />
              </button>
            </div>
            {streamingText && (
              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-4 max-h-20 overflow-y-auto">
                {streamingText.slice(-200)}
              </div>
            )}
          </div>
        </div>
      )}
      {isNew && !isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center space-y-3 pointer-events-auto">
            <div className="text-6xl select-none opacity-10 dark:opacity-5">🧠</div>
            <p className="text-sm text-gray-400 dark:text-gray-600 max-w-xs">
              {language === 'zh'
                ? '双击节点编辑内容，右键打开 AI 操作菜单，长按拖拽节点'
                : 'Double-click to edit · Right-click for AI · Long-press drag to move'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}
