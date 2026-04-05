import { describe, it, expect } from 'vitest'
import { parseJSONResponse, parseTextResponse, buildPrompt } from '@/utils/prompts'
import type { NodePathItem } from '@/types'

describe('parseJSONResponse', () => {
  it('parses a clean JSON array', () => {
    expect(parseJSONResponse('["a", "b", "c"]')).toEqual(['a', 'b', 'c'])
  })

  it('strips markdown code fences', () => {
    expect(parseJSONResponse('```json\n["x", "y"]\n```')).toEqual(['x', 'y'])
    expect(parseJSONResponse('```\n["x"]\n```')).toEqual(['x'])
  })

  it('extracts JSON array from mixed text', () => {
    const result = parseJSONResponse('Here are the items:\n["first", "second", "third"]\nDone.')
    expect(result).toEqual(['first', 'second', 'third'])
  })

  it('filters empty strings', () => {
    expect(parseJSONResponse('["a", "", " ", "b"]')).toEqual(['a', 'b'])
  })

  it('converts non-string items to strings', () => {
    expect(parseJSONResponse('[1, 2, 3]')).toEqual(['1', '2', '3'])
  })

  it('returns null for non-array JSON', () => {
    expect(parseJSONResponse('{"key": "value"}')).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    expect(parseJSONResponse('not json at all')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseJSONResponse('')).toBeNull()
  })
})

describe('parseTextResponse', () => {
  it('returns trimmed text', () => {
    expect(parseTextResponse('  hello world  ')).toBe('hello world')
  })

  it('strips markdown code fences', () => {
    expect(parseTextResponse('```text\nrefined text\n```')).toBe('refined text')
  })

  it('returns null for empty string', () => {
    expect(parseTextResponse('')).toBeNull()
  })

  it('returns null for whitespace-only string', () => {
    expect(parseTextResponse('   ')).toBeNull()
  })
})

describe('buildPrompt', () => {
  const path: NodePathItem[] = [
    { id: '1', content: 'Root', depth: 0 },
    { id: '2', content: 'Child', depth: 1 },
  ]

  it('builds expand prompt', () => {
    const prompt = buildPrompt('expand', path, [], 5, 'en')
    expect(prompt).toContain('5')
    expect(prompt).toContain('Child')
    expect(prompt).toContain('JSON array')
  })

  it('builds refine prompt', () => {
    const prompt = buildPrompt('refine', path, [], 5, 'en')
    expect(prompt).toContain('Child')
    expect(prompt).toContain('refine')
  })

  it('builds reorganize prompt', () => {
    const prompt = buildPrompt('reorganize', path, ['a', 'b'], 5, 'en')
    expect(prompt).toContain('a')
    expect(prompt).toContain('b')
    expect(prompt).toContain('reorganize')
  })

  it('builds summarize prompt', () => {
    const prompt = buildPrompt('summarize', path, ['a', 'b'], 5, 'en')
    expect(prompt).toContain('Summarize')
    expect(prompt).toContain('a')
  })

  it('builds brainstorm prompt', () => {
    const prompt = buildPrompt('brainstorm', path, [], 5, 'en')
    expect(prompt).toContain('brainstorm')
    expect(prompt).toContain('5')
    expect(prompt).toContain('Child')
  })

  it('uses Chinese for zh language', () => {
    const prompt = buildPrompt('expand', path, [], 5, 'zh')
    expect(prompt).toContain('中文')
    expect(prompt).toContain('子主题')
  })
})
