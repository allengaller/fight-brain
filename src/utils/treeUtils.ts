import type { MindMapNode, NodePathItem } from '@/types'
import { walkTree } from 'markmap-common'
import { v4 as uuidv4 } from 'uuid'

export function createNode(content: string, children?: MindMapNode[]): MindMapNode {
  return {
    id: uuidv4(),
    content,
    children: children ?? [],
  }
}

export function createRootNode(content: string): MindMapNode {
  return createNode(content)
}

export function findNodeById(root: MindMapNode, id: string): MindMapNode | null {
  let result: MindMapNode | null = null
  walkTree(root, (node, next) => {
    if (node.id === id) {
      result = node as MindMapNode
    } else {
      next()
    }
  })
  return result
}

export function getNodePath(root: MindMapNode, targetId: string): NodePathItem[] {
  const path: NodePathItem[] = []
  function walk(node: MindMapNode, depth: number): boolean {
    path.push({
      id: node.id,
      content: node.content,
      depth,
    })
    if (node.id === targetId) return true
    for (const child of node.children) {
      if (walk(child, depth + 1)) return true
    }
    path.pop()
    return false
  }
  walk(root, 0)
  return path
}

export function updateNodeContent(root: MindMapNode, nodeId: string, content: string): boolean {
  const node = findNodeById(root, nodeId)
  if (!node) return false
  node.content = content
  return true
}

export function replaceNodeChildren(root: MindMapNode, nodeId: string, children: MindMapNode[]): boolean {
  const node = findNodeById(root, nodeId)
  if (!node) return false
  node.children = children
  return true
}

export function deepCloneTree(node: MindMapNode): MindMapNode {
  return {
    id: node.id,
    content: node.content,
    payload: node.payload ? { ...node.payload } : undefined,
    children: node.children.map(deepCloneTree),
  }
}

export function treeToMarkdown(node: MindMapNode, depth = 0): string {
  const indent = '#'.repeat(Math.min(depth + 1, 6))
  const lines = [`${indent} ${node.content}`]
  for (const child of node.children) {
    lines.push(treeToMarkdown(child, depth + 1))
  }
  return lines.join('\n')
}

export function collectAllNodes(node: MindMapNode): MindMapNode[] {
  const result: MindMapNode[] = []
  walkTree(node, (n, next) => {
    result.push(n as MindMapNode)
    next()
  })
  return result
}

export function countNodes(node: MindMapNode): number {
  let count = 0
  walkTree(node, () => {
    count++
  })
  return count
}

export function getMaxDepth(node: MindMapNode): number {
  let maxDepth = 0
  function walk(n: MindMapNode, depth: number) {
    if (depth > maxDepth) maxDepth = depth
    for (const child of n.children) {
      walk(child, depth + 1)
    }
  }
  walk(node, 0)
  return maxDepth
}
