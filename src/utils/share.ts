import type { MindMapNode } from '@/types'

export function encodeShareData(root: MindMapNode): string {
  const json = JSON.stringify(root)
  const encoded = btoa(unescape(encodeURIComponent(json)))
  return encoded
}

export function decodeShareData(hash: string): MindMapNode | null {
  try {
    const json = decodeURIComponent(escape(atob(hash)))
    const data = JSON.parse(json) as MindMapNode
    if (data?.id && data?.content && Array.isArray(data?.children)) {
      return data
    }
  } catch {
    // invalid data
  }
  return null
}

export function generateShareURL(root: MindMapNode): string {
  const encoded = encodeShareData(root)
  const url = new URL(window.location.href)
  url.hash = encoded
  return url.toString()
}

export function hasShareData(): boolean {
  const hash = window.location.hash.slice(1)
  return hash.length > 0
}

export function loadShareData(): MindMapNode | null {
  const hash = window.location.hash.slice(1)
  if (!hash) return null
  return decodeShareData(hash)
}
