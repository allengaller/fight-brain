import { useRef, useCallback, useEffect } from 'react'
import { Markmap } from 'markmap-view'
import type { MindMapNode } from '@/types'
import { useMindMapStore } from '@/store/mindmapStore'
import { MarkmapContext } from '@/hooks/markmapContext'

export function MarkmapProvider({ children }: { children: React.ReactNode }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const mmRef = useRef<Markmap | null>(null)
  const nodeIdMap = useRef<Map<string, string>>(new Map())

  const root = useMindMapStore((s) => s.root)
  const settings = useMindMapStore((s) => s.settings)
  const selectedNodeId = useMindMapStore((s) => s.selectedNodeId)
  const selectedNodeIds = useMindMapStore((s) => s.selectedNodeIds)

  useEffect(() => {
    if (!svgRef.current) return

    if (mmRef.current) {
      mmRef.current.destroy()
      mmRef.current = null
    }

    const isDark = settings.theme === 'dark'

    const mm = Markmap.create(svgRef.current, {
      duration: 500,
      maxWidth: 300,
      initialExpandLevel: settings.initialExpandLevel,
      zoom: true,
      pan: true,
      color: (node: { state: { depth: number }; payload?: Record<string, unknown> }) => {
        const customColor = node.payload?.color as string | undefined
        if (customColor) return customColor
        const colors = isDark
          ? ['#818cf8', '#a78bfa', '#c084fc', '#f472b6', '#fb923c', '#facc15', '#34d399', '#22d3ee']
          : ['#4f46e5', '#7c3aed', '#9333ea', '#db2777', '#ea580c', '#ca8a04', '#059669', '#0891b2']
        return colors[node.state.depth % colors.length]
      },
    })

    mmRef.current = mm

    return () => {
      mm.destroy()
      mmRef.current = null
    }
  }, [svgRef, settings.theme, settings.initialExpandLevel])

  useEffect(() => {
    if (!mmRef.current) return
    const data = toMarkmapData(root)
    nodeIdMap.current.clear()
    buildNodeIdMap(root, nodeIdMap.current)
    mmRef.current.setData(data)
    if (useMindMapStore.getState().settings.autoFit) {
      mmRef.current.fit()
    }
    requestAnimationFrame(() => {
      injectNodeIds(svgRef.current, nodeIdMap.current)
      updateSelectionHighlight(svgRef.current, selectedNodeId, selectedNodeIds)
    })
  }, [root, selectedNodeId, selectedNodeIds])

  const fit = useCallback(() => {
    mmRef.current?.fit()
  }, [])

  const rescale = useCallback((scale: number) => {
    mmRef.current?.rescale(scale)
  }, [])

  const getMarkmap = useCallback(() => mmRef.current, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    let timer: ReturnType<typeof setTimeout> | null = null
    const observer = new ResizeObserver(() => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        mmRef.current?.fit()
      }, 300)
    })
    observer.observe(svg.parentElement ?? svg)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [svgRef])

  return (
    <MarkmapContext.Provider value={{ svgRef, mmRef, fit, rescale, getMarkmap, nodeIdMap }}>
      {children}
    </MarkmapContext.Provider>
  )
}

function toMarkmapData(node: MindMapNode): { content: string; payload?: Record<string, unknown>; children: ReturnType<typeof toMarkmapData>[] } {
  return {
    content: node.content,
    payload: node.payload,
    children: node.children.map(toMarkmapData),
  }
}

function buildNodeIdMap(node: MindMapNode, map: Map<string, string>, path = '', index = 1) {
  const currentPath = path === '' ? String(index) : `${path}.${index}`
  map.set(currentPath, node.id)
  node.children.forEach((child, i) => {
    buildNodeIdMap(child, map, currentPath, i + 1)
  })
}

function injectNodeIds(svg: SVGSVGElement | null, nodeIdMap: Map<string, string>) {
  if (!svg) return
  const nodes = svg.querySelectorAll<SVGGElement>('g.markmap-node')
  nodes.forEach((g) => {
    const dataPath = g.dataset.path
    if (dataPath && nodeIdMap.has(dataPath)) {
      g.dataset.nodeId = nodeIdMap.get(dataPath)!
    }
  })
}

function updateSelectionHighlight(svg: SVGSVGElement | null, selectedNodeId: string | null, selectedNodeIds: Set<string>) {
  if (!svg) return
  const nodes = svg.querySelectorAll<SVGGElement>('g.markmap-node')
  nodes.forEach((g) => {
    const nodeId = g.dataset.nodeId
    const circle = g.querySelector<SVGElement>('circle:last-of-type')
    if (!circle) return
    const isSelected = nodeId === selectedNodeId || (nodeId ? selectedNodeIds.has(nodeId) : false)
    if (isSelected) {
      circle.setAttribute('r', '6')
      circle.style.filter = 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.6))'
      circle.style.strokeWidth = '2.5'
      circle.style.stroke = '#6366f1'
    } else {
      circle.removeAttribute('style')
      circle.setAttribute('r', '4')
    }
  })
}
