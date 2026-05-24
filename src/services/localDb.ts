import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { MindMapNode, Settings } from '@/types'
import { STORAGE_KEYS } from '@/constants'

interface FightBrainDB extends DBSchema {
  mindmaps: {
    key: string
    value: {
      id: string
      root: MindMapNode
      updatedAt: number
      name: string
    }
  }
  settings: {
    key: string
    value: Settings
  }
}

let dbPromise: Promise<IDBPDatabase<FightBrainDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<FightBrainDB>('fightbrain', 1, {
      upgrade(db) {
        db.createObjectStore('mindmaps', { keyPath: 'id' })
        db.createObjectStore('settings')
      },
    })
  }
  return dbPromise
}

export const localDb = {
  async saveMindmap(id: string, root: MindMapNode, name: string): Promise<void> {
    const db = await getDB()
    await db.put('mindmaps', { id, root, name, updatedAt: Date.now() })
  },

  async loadMindmap(id: string): Promise<MindMapNode | null> {
    const db = await getDB()
    const record = await db.get('mindmaps', id)
    return record?.root ?? null
  },

  async listMindmaps(): Promise<Array<{ id: string; name: string; updatedAt: number }>> {
    const db = await getDB()
    const all = await db.getAll('mindmaps')
    return all.map(({ id, name, updatedAt }) => ({ id, name, updatedAt }))
  },

  async deleteMindmap(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('mindmaps', id)
  },

  async saveSettings(settings: Settings): Promise<void> {
    const db = await getDB()
    await db.put('settings', settings, 'main')
  },

  async loadSettings(): Promise<Settings | null> {
    const db = await getDB()
    return (await db.get('settings', 'main')) ?? null
  },
}

// Sync status for cloud sync
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'

let syncStatus: SyncStatus = 'idle'
const syncListeners = new Set<(status: SyncStatus) => void>()

export function getSyncStatus(): SyncStatus {
  return syncStatus
}

export function setSyncStatus(status: SyncStatus): void {
  syncStatus = status
  syncListeners.forEach(listener => listener(status))
}

export function onSyncStatusChange(listener: (status: SyncStatus) => void): () => void {
  syncListeners.add(listener)
  return () => syncListeners.delete(listener)
}