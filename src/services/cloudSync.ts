import { localDb, setSyncStatus } from './localDb'
import type { MindMapNode } from '@/types'

// Last-write-wins sync strategy (simple CRDT-like)
export interface SyncableMindmap {
  id: string
  root: MindMapNode
  name: string
  updatedAt: number
  syncedAt?: number
}

export async function syncToCloud(remoteUrl: string, apiKey: string): Promise<boolean> {
  setSyncStatus('syncing')
  try {
    const localMindmaps = await localDb.listMindmaps()

    for (const { id, name, updatedAt } of localMindmaps) {
      const localData = await localDb.loadMindmap(id)
      if (!localData) continue

      const syncable: SyncableMindmap = {
        id,
        root: localData,
        name,
        updatedAt,
        syncedAt: Date.now(),
      }

      const response = await fetch(`${remoteUrl}/mindmaps/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(syncable),
      })

      if (!response.ok) {
        throw new Error(`Sync failed for ${id}: ${response.statusText}`)
      }
    }

    setSyncStatus('synced')
    return true
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      setSyncStatus('offline')
    } else {
      setSyncStatus('error')
    }
    return false
  }
}

export async function syncFromCloud(remoteUrl: string, apiKey: string): Promise<boolean> {
  setSyncStatus('syncing')
  try {
    const response = await fetch(`${remoteUrl}/mindmaps`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch mindmaps: ${response.statusText}`)
    }

    const remoteMindmaps: SyncableMindmap[] = await response.json()

    for (const remote of remoteMindmaps) {
      const local = await localDb.loadMindmap(remote.id)

      // Remote wins if newer or local doesn't exist
      if (!local || remote.updatedAt > (local as unknown as { updatedAt?: number })?.updatedAt) {
        await localDb.saveMindmap(remote.id, remote.root, remote.name)
      }
    }

    setSyncStatus('synced')
    return true
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      setSyncStatus('offline')
    } else {
      setSyncStatus('error')
    }
    return false
  }
}

export function createShareLink(_id: string, root: MindMapNode): string {
  const data = JSON.stringify(root)
  const compressed = btoa(encodeURIComponent(data))
  return `${window.location.origin}${window.location.pathname}#shared=${compressed}`
}

export function loadFromShareLink(): MindMapNode | null {
  const hash = window.location.hash
  if (!hash.startsWith('#shared=')) return null

  try {
    const compressed = hash.slice(8)
    const data = decodeURIComponent(atob(compressed))
    return JSON.parse(data) as MindMapNode
  } catch {
    return null
  }
}