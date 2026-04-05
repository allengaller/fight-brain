import type { LLMConfig, LLMMessage } from '@/types'

interface ChatCompletionRequest {
  model: string
  messages: LLMMessage[]
  max_completion_tokens?: number
  temperature?: number
  stream?: boolean
}

export interface StreamCallbacks {
  onChunk: (text: string) => void
  onDone: (fullText: string) => void
  onError: (error: Error) => void
}

export class LLMAbortedError extends Error {
  constructor(message = 'Request aborted') {
    super(message)
    this.name = 'LLMAbortedError'
  }
}

export class LLMError extends Error {
  statusCode?: number
  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'LLMError'
    this.statusCode = statusCode
  }
}

export async function chatCompletionStream(
  config: LLMConfig,
  messages: LLMMessage[],
  callbacks: StreamCallbacks,
  options?: {
    maxTokens?: number
    temperature?: number
    signal?: AbortSignal
  },
): Promise<void> {
  const { apiKey, baseUrl, model } = config

  if (!apiKey) {
    callbacks.onError(new LLMError('API Key is not configured. Please set it in Settings.'))
    return
  }

  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`

  const body: ChatCompletionRequest = {
    model,
    messages,
    max_completion_tokens: options?.maxTokens ?? 2048,
    temperature: options?.temperature ?? 0.7,
    stream: true,
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: options?.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      callbacks.onError(new LLMAbortedError())
      return
    }
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    return
  }

  if (!response.ok) {
    const status = response.status
    let errorText = ''
    try {
      const errBody = await response.json()
      errorText = errBody?.error?.message ?? errBody?.message ?? JSON.stringify(errBody)
    } catch {
      errorText = response.statusText
    }
    callbacks.onError(new LLMError(`API error (${status}): ${errorText}`, status))
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    callbacks.onError(new Error('No response body'))
    return
  }

  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') continue
        if (!trimmed.startsWith('data: ')) continue

        try {
          const json = JSON.parse(trimmed.slice(6))
          const content = json.choices?.[0]?.delta?.content
          if (content) {
            fullText += content
            callbacks.onChunk(content)
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      callbacks.onError(new LLMAbortedError())
      return
    }
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    return
  }

  callbacks.onDone(fullText)
}
