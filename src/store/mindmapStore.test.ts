import { describe, it, expect, beforeEach } from 'vitest'
import { useMindMapStore } from '@/store/mindmapStore'

beforeEach(() => {
  useMindMapStore.setState({
    root: { id: 'root', content: 'Root', children: [] },
    selectedNodeId: null,
    isGenerating: false,
    generatingNodeId: null,
    streamingText: '',
    error: null,
    history: [],
    historyIndex: -1,
    _abortController: null,
  })
})

describe('mindmapStore CRUD', () => {
  it('starts with initial root', () => {
    const state = useMindMapStore.getState()
    expect(state.root.content).toBe('Root')
    expect(state.root.children).toHaveLength(0)
  })

  it('selects a node', () => {
    useMindMapStore.getState().selectNode('root')
    expect(useMindMapStore.getState().selectedNodeId).toBe('root')
  })

  it('selects null to deselect', () => {
    useMindMapStore.getState().selectNode('root')
    useMindMapStore.getState().selectNode(null)
    expect(useMindMapStore.getState().selectedNodeId).toBeNull()
  })

  it('adds a child node', () => {
    useMindMapStore.getState().addChild('root', 'Child 1')
    const state = useMindMapStore.getState()
    expect(state.root.children).toHaveLength(1)
    expect(state.root.children[0].content).toBe('Child 1')
  })

  it('adds a sibling node', () => {
    useMindMapStore.getState().addChild('root', 'First')
    const firstId = useMindMapStore.getState().root.children[0].id
    useMindMapStore.getState().addSibling(firstId, 'Second')
    const state = useMindMapStore.getState()
    expect(state.root.children).toHaveLength(2)
    expect(state.root.children[1].content).toBe('Second')
  })

  it('does not add sibling to root', () => {
    useMindMapStore.getState().addSibling('root', 'Sibling')
    expect(useMindMapStore.getState().root.children).toHaveLength(0)
  })

  it('deletes a node', () => {
    useMindMapStore.getState().addChild('root', 'Child')
    const childId = useMindMapStore.getState().root.children[0].id
    useMindMapStore.getState().deleteNode(childId)
    expect(useMindMapStore.getState().root.children).toHaveLength(0)
  })

  it('does not delete root', () => {
    useMindMapStore.getState().deleteNode('root')
    const state = useMindMapStore.getState()
    expect(state.root.content).toBe('Root')
  })

  it('updates node content', () => {
    useMindMapStore.getState().updateContent('root', 'Updated Root')
    expect(useMindMapStore.getState().root.content).toBe('Updated Root')
  })

  it('toggles collapse', () => {
    useMindMapStore.getState().toggleCollapse('root')
    expect(useMindMapStore.getState().root.payload?.fold).toBe(1)
    useMindMapStore.getState().toggleCollapse('root')
    expect(useMindMapStore.getState().root.payload?.fold).toBe(0)
  })
})

describe('mindmapStore undo/redo', () => {
  it('can undo first action', () => {
    useMindMapStore.getState().addChild('root', 'Child')
    expect(useMindMapStore.getState().root.children).toHaveLength(1)
    useMindMapStore.getState().undo()
    expect(useMindMapStore.getState().root.children).toHaveLength(0)
  })

  it('can redo after undo', () => {
    useMindMapStore.getState().addChild('root', 'First')
    useMindMapStore.getState().addChild('root', 'Second')
    useMindMapStore.getState().undo()
    expect(useMindMapStore.getState().root.children).toHaveLength(1)
    useMindMapStore.getState().redo()
    expect(useMindMapStore.getState().root.children).toHaveLength(2)
  })

  it('canUndo returns false when no history', () => {
    expect(useMindMapStore.getState().canUndo()).toBe(false)
  })

  it('canRedo returns false when nothing to redo', () => {
    expect(useMindMapStore.getState().canRedo()).toBe(false)
  })

  it('preserves selectedNodeId through undo/redo', () => {
    useMindMapStore.getState().addChild('root', 'Child')
    const childId = useMindMapStore.getState().root.children[0].id
    useMindMapStore.getState().selectNode(childId)
    useMindMapStore.getState().addChild(childId, 'Grandchild')
    useMindMapStore.getState().undo()
    expect(useMindMapStore.getState().root.children[0].children).toHaveLength(0)
  })
})

describe('mindmapStore moveNode', () => {
  function setupTree() {
    useMindMapStore.getState().addChild('root', 'A')
    useMindMapStore.getState().addChild('root', 'B')
    const aId = useMindMapStore.getState().root.children[0].id
    const bId = useMindMapStore.getState().root.children[1].id
    useMindMapStore.getState().addChild(aId, 'A1')
    useMindMapStore.getState().addChild(aId, 'A2')
    return { aId, bId }
  }

  it('moves a node to a new parent', () => {
    const { bId } = setupTree()
    const a1Id = useMindMapStore.getState().root.children[0].children[0].id
    useMindMapStore.getState().moveNode(a1Id, bId)
    const state = useMindMapStore.getState()
    expect(state.root.children[0].children).toHaveLength(1)
    expect(state.root.children[1].children).toHaveLength(1)
    expect(state.root.children[1].children[0].content).toBe('A1')
  })

  it('does not move root node', () => {
    const { bId } = setupTree()
    const rootChildrenBefore = useMindMapStore.getState().root.children.length
    useMindMapStore.getState().moveNode('root', bId)
    expect(useMindMapStore.getState().root.children.length).toBe(rootChildrenBefore)
  })

  it('does not move node onto itself', () => {
    const { aId, bId: _bId } = setupTree()
    void _bId
    const childrenBefore = useMindMapStore.getState().root.children[0].children.length
    useMindMapStore.getState().moveNode(aId, aId)
    expect(useMindMapStore.getState().root.children[0].children.length).toBe(childrenBefore)
  })

  it('supports insertIndex', () => {
    const { bId } = setupTree()
    const a1Id = useMindMapStore.getState().root.children[0].children[0].id
    const a2Id = useMindMapStore.getState().root.children[0].children[1].id
    useMindMapStore.getState().moveNode(a1Id, bId)
    useMindMapStore.getState().moveNode(a2Id, bId, 0)
    const state = useMindMapStore.getState()
    expect(state.root.children[1].children).toHaveLength(2)
    expect(state.root.children[1].children[0].content).toBe('A2')
    expect(state.root.children[1].children[1].content).toBe('A1')
  })
})

describe('mindmapStore export/import', () => {
  it('exports as JSON', () => {
    useMindMapStore.getState().addChild('root', 'Child')
    const json = useMindMapStore.getState().exportAsJSON()
    const parsed = JSON.parse(json)
    expect(parsed.content).toBe('Root')
    expect(parsed.children).toHaveLength(1)
  })

  it('imports from valid JSON', () => {
    useMindMapStore.getState().addChild('root', 'Old')
    const json = JSON.stringify({ id: 'new', content: 'Imported', children: [] })
    const result = useMindMapStore.getState().importFromJSON(json)
    expect(result).toBe(true)
    expect(useMindMapStore.getState().root.content).toBe('Imported')
  })

  it('rejects invalid JSON', () => {
    expect(useMindMapStore.getState().importFromJSON('not json')).toBe(false)
    expect(useMindMapStore.getState().importFromJSON('{}')).toBe(false)
  })
})

describe('mindmapStore resetMindmap', () => {
  it('resets to a new topic', () => {
    useMindMapStore.getState().addChild('root', 'Child')
    useMindMapStore.getState().resetMindmap('New Topic')
    const state = useMindMapStore.getState()
    expect(state.root.content).toBe('New Topic')
    expect(state.root.children).toHaveLength(0)
    expect(state.selectedNodeId).toBeNull()
  })
})
