import { describe, it, expect } from 'vitest'
import {
  createNode,
  createRootNode,
  findNodeById,
  getNodePath,
  updateNodeContent,
  replaceNodeChildren,
  deepCloneTree,
  treeToMarkdown,
  collectAllNodes,
} from '@/utils/treeUtils'
import type { MindMapNode } from '@/types'

function makeTree(): MindMapNode {
  const root = createNode('Root')
  const child1 = createNode('Child 1')
  const child2 = createNode('Child 2')
  const grandchild1 = createNode('Grandchild 1')
  child1.children.push(grandchild1)
  root.children.push(child1, child2)
  return root
}

describe('createNode', () => {
  it('creates a node with content and empty children', () => {
    const node = createNode('Hello')
    expect(node.content).toBe('Hello')
    expect(node.children).toEqual([])
    expect(node.id).toBeDefined()
  })

  it('creates a node with provided children', () => {
    const child = createNode('Child')
    const node = createNode('Parent', [child])
    expect(node.children).toHaveLength(1)
    expect(node.children[0].content).toBe('Child')
  })
})

describe('createRootNode', () => {
  it('creates a root node same as createNode', () => {
    const root = createRootNode('Topic')
    expect(root.content).toBe('Topic')
    expect(root.children).toEqual([])
    expect(root.id).toBeDefined()
  })
})

describe('findNodeById', () => {
  it('finds root node', () => {
    const tree = makeTree()
    const found = findNodeById(tree, tree.id)
    expect(found).not.toBeNull()
    expect(found!.content).toBe('Root')
  })

  it('finds a nested node', () => {
    const tree = makeTree()
    const gc = tree.children[0].children[0]
    const found = findNodeById(tree, gc.id)
    expect(found).not.toBeNull()
    expect(found!.content).toBe('Grandchild 1')
  })

  it('returns null for non-existent id', () => {
    const tree = makeTree()
    expect(findNodeById(tree, 'non-existent')).toBeNull()
  })
})

describe('getNodePath', () => {
  it('returns path to root', () => {
    const tree = makeTree()
    const path = getNodePath(tree, tree.id)
    expect(path).toHaveLength(1)
    expect(path[0].content).toBe('Root')
    expect(path[0].depth).toBe(0)
  })

  it('returns path to grandchild with correct depths', () => {
    const tree = makeTree()
    const gc = tree.children[0].children[0]
    const path = getNodePath(tree, gc.id)
    expect(path).toHaveLength(3)
    expect(path[0].content).toBe('Root')
    expect(path[0].depth).toBe(0)
    expect(path[1].content).toBe('Child 1')
    expect(path[1].depth).toBe(1)
    expect(path[2].content).toBe('Grandchild 1')
    expect(path[2].depth).toBe(2)
  })

  it('returns empty array for non-existent id', () => {
    const tree = makeTree()
    expect(getNodePath(tree, 'non-existent')).toEqual([])
  })
})

describe('updateNodeContent', () => {
  it('updates content of existing node', () => {
    const tree = makeTree()
    const result = updateNodeContent(tree, tree.children[0].id, 'Updated')
    expect(result).toBe(true)
    expect(tree.children[0].content).toBe('Updated')
  })

  it('returns false for non-existent node', () => {
    const tree = makeTree()
    expect(updateNodeContent(tree, 'non-existent', 'X')).toBe(false)
  })
})

describe('replaceNodeChildren', () => {
  it('replaces children of a node', () => {
    const tree = makeTree()
    const newChildren = [createNode('A'), createNode('B')]
    const result = replaceNodeChildren(tree, tree.children[0].id, newChildren)
    expect(result).toBe(true)
    expect(tree.children[0].children).toHaveLength(2)
    expect(tree.children[0].children[0].content).toBe('A')
    expect(tree.children[0].children[1].content).toBe('B')
  })

  it('returns false for non-existent node', () => {
    const tree = makeTree()
    expect(replaceNodeChildren(tree, 'non-existent', [])).toBe(false)
  })
})

describe('deepCloneTree', () => {
  it('creates a deep clone with different references', () => {
    const tree = makeTree()
    const clone = deepCloneTree(tree)
    expect(clone.id).toBe(tree.id)
    expect(clone).not.toBe(tree)
    expect(clone.children[0]).not.toBe(tree.children[0])
    expect(clone.children[0].children[0]).not.toBe(tree.children[0].children[0])
  })

  it('preserves payload', () => {
    const node = createNode('X')
    node.payload = { fold: 1, color: 'red' }
    const clone = deepCloneTree(node)
    expect(clone.payload).toEqual({ fold: 1, color: 'red' })
    expect(clone.payload).not.toBe(node.payload)
  })
})

describe('treeToMarkdown', () => {
  it('converts a simple tree to markdown headings', () => {
    const tree = makeTree()
    const md = treeToMarkdown(tree)
    expect(md).toContain('# Root')
    expect(md).toContain('## Child 1')
    expect(md).toContain('### Grandchild 1')
    expect(md).toContain('## Child 2')
  })
})

describe('collectAllNodes', () => {
  it('collects all nodes in the tree', () => {
    const tree = makeTree()
    const nodes = collectAllNodes(tree)
    expect(nodes).toHaveLength(4)
    const contents = nodes.map(n => n.content).sort()
    expect(contents).toEqual(['Child 1', 'Child 2', 'Grandchild 1', 'Root'])
  })
})
