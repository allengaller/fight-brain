import type { AIAction, NodePathItem } from '@/types'

function buildPathString(path: NodePathItem[]): string {
  return path.map(p => p.content).join(' > ')
}

export function buildExpandPrompt(
  path: NodePathItem[],
  count: number,
  lang: 'zh' | 'en',
): string {
  const pathStr = buildPathString(path)
  const currentNode = path[path.length - 1]?.content ?? ''
  const langInstruction =
    lang === 'zh'
      ? `请用中文回答。`
      : `Please respond in English.`

  return `${lang === 'zh' ? `你是一个专业的头脑风暴助手。用户正在使用脑图工具进行思维发散。` : `You are a professional brainstorming assistant. The user is brainstorming with a mind map tool.`}

${lang === 'zh' ? `当前思维路径：${pathStr}` : `Current thought path: ${pathStr}`}

${lang === 'zh' ? `请为主题「${currentNode}」生成 ${count} 个有创意的子主题方向。` : `Generate ${count} creative sub-topics for "${currentNode}".`}

${lang === 'zh' ? `要求：` : `Requirements:`}
${lang === 'zh' ? `- 子主题之间应该有明显的差异性` : `- Sub-topics should be clearly distinct from each other`}
${lang === 'zh' ? `- 覆盖不同的思考维度` : `- Cover different thinking dimensions`}
${lang === 'zh' ? `- 简洁有力，每个子主题不超过15个字` : `- Concise and impactful, each sub-topic under 15 words`}
${lang === 'zh' ? `- 有一定的深度和洞察力` : `- Show depth and insight`}

${lang === 'zh' ? `以 JSON 数组格式返回，例如：["子主题1", "子主题2", "子主题3"]` : `Return as a JSON array, e.g.: ["topic1", "topic2", "topic3"]`}
${lang === 'zh' ? `只返回 JSON 数组，不要其他内容。` : `Return ONLY the JSON array, nothing else.`}
${langInstruction}`
}

export function buildRefinePrompt(
  path: NodePathItem[],
  lang: 'zh' | 'en',
): string {
  const currentNode = path[path.length - 1]?.content ?? ''
  const pathStr = buildPathString(path.slice(0, -1))
  const langInstruction =
    lang === 'zh'
      ? `请用中文回答。`
      : `Please respond in English.`

  return `${lang === 'zh' ? `你是一个专业的文字编辑助手。` : `You are a professional writing assistant.`}

${lang === 'zh' ? `上下文路径：${pathStr || '（根节点）'}` : `Context path: ${pathStr || '(root)'}`}
${lang === 'zh' ? `当前节点内容：「${currentNode}」` : `Current node content: "${currentNode}"`}

${lang === 'zh' ? `请优化这个节点的文字表述，使其更加精炼、准确、有表现力。` : `Please refine the text to be more concise, accurate, and expressive.`}

${lang === 'zh' ? `只返回优化后的文字，不要其他内容。` : `Return ONLY the refined text, nothing else.`}
${langInstruction}`
}

export function buildReorganizePrompt(
  path: NodePathItem[],
  children: string[],
  lang: 'zh' | 'en',
): string {
  const currentNode = path[path.length - 1]?.content ?? ''
  const childrenStr = children.map((c, i) => `${i + 1}. ${c}`).join('\n')
  const langInstruction =
    lang === 'zh'
      ? `请用中文回答。`
      : `Please respond in English.`

  return `${lang === 'zh' ? `你是一个专业的信息整理助手。` : `You are a professional information organizer.`}

${lang === 'zh' ? `当前节点：「${currentNode}」` : `Current node: "${currentNode}"`}
${lang === 'zh' ? `当前子节点：\n${childrenStr}` : `Current children:\n${childrenStr}`}

${lang === 'zh' ? `请对这些子节点进行重新整理：` : `Please reorganize these children:`}
${lang === 'zh' ? `- 合并相似的内容` : `- Merge similar items`}
${lang === 'zh' ? `- 按逻辑关系排序` : `- Sort by logical relationship`}
${lang === 'zh' ? `- 删除冗余项` : `- Remove redundant items`}
${lang === 'zh' ? `- 补充缺失的重要方向` : `- Add missing important directions`}

${lang === 'zh' ? `以 JSON 数组格式返回整理后的子节点，例如：["整理后1", "整理后2"]` : `Return as a JSON array, e.g.: ["item1", "item2"]`}
${lang === 'zh' ? `只返回 JSON 数组，不要其他内容。` : `Return ONLY the JSON array, nothing else.`}
${langInstruction}`
}

export function buildSummarizePrompt(
  path: NodePathItem[],
  children: string[],
  lang: 'zh' | 'en',
): string {
  const currentNode = path[path.length - 1]?.content ?? ''
  const childrenStr = children.map(c => `  - ${c}`).join('\n')
  const langInstruction =
    lang === 'zh'
      ? `请用中文回答。`
      : `Please respond in English.`

  return `${lang === 'zh' ? `你是一个专业的内容总结助手。` : `You are a professional summarization assistant.`}

${lang === 'zh' ? `当前节点：「${currentNode}」` : `Current node: "${currentNode}"`}
${lang === 'zh' ? `子节点内容：\n${childrenStr}` : `Child nodes:\n${childrenStr}`}

${lang === 'zh' ? `请将以上所有子节点内容总结为一段精炼的文字（不超过30个字），作为当前节点的新内容。` : `Summarize all child nodes into one concise text (under 30 words) as the new content of the current node.`}

${lang === 'zh' ? `只返回总结后的文字，不要其他内容。` : `Return ONLY the summary text, nothing else.`}
${langInstruction}`
}

export function buildBrainstormPrompt(
  path: NodePathItem[],
  count: number,
  lang: 'zh' | 'en',
): string {
  const pathStr = buildPathString(path)
  const currentNode = path[path.length - 1]?.content ?? ''
  const langInstruction =
    lang === 'zh'
      ? `请用中文回答。`
      : `Please respond in English.`

  return `${lang === 'zh' ? `你是一个极具创意的头脑风暴专家，擅长发散性思维和跨界联想。` : `You are a highly creative brainstorming expert, skilled in divergent thinking and cross-domain association.`}

${lang === 'zh' ? `当前思维路径：${pathStr}` : `Current thought path: ${pathStr}`}

${lang === 'zh' ? `针对「${currentNode}」，请进行自由发散式联想，生成 ${count} 个意想不到的创意方向。` : `For "${currentNode}", brainstorm ${count} unexpected creative directions.`}

${lang === 'zh' ? `要求：` : `Requirements:`}
${lang === 'zh' ? `- 鼓励跨界联想和反常规思考` : `- Encourage cross-domain association and unconventional thinking`}
${lang === 'zh' ? `- 结合不同领域的视角` : `- Combine perspectives from different fields`}
${lang === 'zh' ? `- 每个方向简洁有力，不超过20个字` : `- Each direction concise and impactful, under 20 words`}
${lang === 'zh' ? `- 大胆有趣，打破常规` : `- Bold, interesting, and unconventional`}

${lang === 'zh' ? `以 JSON 数组格式返回，例如：["创意1", "创意2", "创意3"]` : `Return as a JSON array, e.g.: ["idea1", "idea2", "idea3"]`}
${lang === 'zh' ? `只返回 JSON 数组，不要其他内容。` : `Return ONLY the JSON array, nothing else.`}
${langInstruction}`
}

export function buildPrompt(
  action: AIAction,
  path: NodePathItem[],
  children: string[],
  count: number,
  lang: 'zh' | 'en',
): string {
  switch (action) {
    case 'expand':
      return buildExpandPrompt(path, count, lang)
    case 'refine':
      return buildRefinePrompt(path, lang)
    case 'reorganize':
      return buildReorganizePrompt(path, children, lang)
    case 'summarize':
      return buildSummarizePrompt(path, children, lang)
    case 'brainstorm':
      return buildBrainstormPrompt(path, count, lang)
  }
}

export function parseJSONResponse(text: string): string[] | null {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) {
      return parsed.map(item => String(item).trim()).filter(Boolean)
    }
    return null
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item).trim()).filter(Boolean)
        }
      } catch {
        // fall through
      }
    }
    return null
  }
}

export function parseTextResponse(text: string): string | null {
  const cleaned = text.trim().replace(/^```(?:text)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return cleaned || null
}
