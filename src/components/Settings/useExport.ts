import { useCallback } from 'react'
import { toPng, toSvg } from 'html-to-image'
import { useMindMapStore } from '@/store/mindmapStore'
import { treeToMarkdown } from '@/utils/treeUtils'

export function useExport(svgRef: React.RefObject<SVGSVGElement | null>) {
  const root = useMindMapStore((s) => s.root)
  const theme = useMindMapStore((s) => s.settings.theme)

  const bgColor = theme === 'dark' ? '#030712' : '#ffffff'

  const exportMarkdown = useCallback(() => {
    const md = treeToMarkdown(root)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    downloadBlob(blob, 'fightbrain-export.md')
  }, [root])

  const exportPng = useCallback(async () => {
    if (!svgRef.current) return
    try {
      const dataUrl = await toPng(svgRef.current as unknown as HTMLElement, {
        backgroundColor: bgColor,
        pixelRatio: 2,
      })
      downloadUrl(dataUrl, 'fightbrain-export.png')
    } catch {
      console.error('Failed to export PNG')
    }
  }, [svgRef, bgColor])

  const exportSvg = useCallback(async () => {
    if (!svgRef.current) return
    try {
      const dataUrl = await toSvg(svgRef.current as unknown as HTMLElement, {
        backgroundColor: bgColor,
      })
      downloadUrl(dataUrl, 'fightbrain-export.svg')
    } catch {
      console.error('Failed to export SVG')
    }
  }, [svgRef, bgColor])

  return { exportMarkdown, exportPng, exportSvg }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  downloadUrl(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function downloadUrl(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}
