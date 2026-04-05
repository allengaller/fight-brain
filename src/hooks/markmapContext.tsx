import { createContext, useContext } from 'react'
import type { Markmap } from 'markmap-view'

interface MarkmapContextValue {
  svgRef: React.RefObject<SVGSVGElement | null>
  mmRef: React.MutableRefObject<Markmap | null>
  fit: () => void
  rescale: (scale: number) => void
  getMarkmap: () => Markmap | null
  nodeIdMap: React.MutableRefObject<Map<string, string>>
}

export const MarkmapContext = createContext<MarkmapContextValue | null>(null)

export function useMarkmapContext() {
  const ctx = useContext(MarkmapContext)
  if (!ctx) throw new Error('useMarkmapContext must be used within MarkmapProvider')
  return ctx
}
