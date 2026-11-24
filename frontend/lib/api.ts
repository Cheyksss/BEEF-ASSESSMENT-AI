import { PredictionProgress, PredictionResponse } from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export class APIError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = "APIError"
  }
}

/**
 * Helper to wait for a given duration in milliseconds
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Submit image for beef quality assessment with retry logic
 * @param file Image file to assess
 * @param accessToken Supabase access token
 * @param maxRetries Maximum retry attempts (default: 3)
 * @returns Prediction response
 */
export async function predictBeefQuality(
  file: File,
  accessToken?: string,
  onProgress?: (progress: PredictionProgress) => void,
  maxRetries = 3
): Promise<PredictionResponse> {
  let attempt = 0
  let lastError: Error | null = null

  while (attempt < maxRetries) {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const headers: Record<string, string> = {}
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`
      }

      const response = await fetch(`${API_URL}/predict/stream`, {
        method: "POST",
        headers,
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage =
          errorData.detail || `Server returned error status ${response.status}`

        // Client errors are not transient, so retrying the same request cannot help.
        if (response.status < 500) {
          throw new APIError(response.status, errorMessage)
        }

        // 5xx errors can be transient, throw to retry
        throw new APIError(response.status, errorMessage)
      }

      if (!response.body) {
        throw new APIError(response.status, "The server did not provide a progress stream")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let result: PredictionResponse | null = null

      const processEvent = (eventText: string) => {
        let eventType = "message"
        const dataLines: string[] = []
        for (const line of eventText.split(/\r?\n/)) {
          if (line.startsWith("event:")) eventType = line.slice(6).trim()
          if (line.startsWith("data:")) dataLines.push(line.slice(5).trim())
        }
        if (dataLines.length === 0) return

        const data = JSON.parse(dataLines.join("\n"))
        if (eventType === "progress") {
          onProgress?.({
            completed_stages: data.completed_stages,
            total_stages: data.total_stages,
            stage: data.stage,
          })
        } else if (eventType === "result") {
          result = data as PredictionResponse
        } else if (eventType === "error") {
          throw new APIError(data.status, data.message)
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        buffer += decoder.decode(value, { stream: !done })
        const events = buffer.split(/\r?\n\r?\n/)
        buffer = events.pop() ?? ""
        for (const eventText of events) processEvent(eventText)
        if (done) break
      }
      if (buffer.trim()) processEvent(buffer)
      if (!result) {
        throw new APIError(response.status, "The assessment stream ended without a result")
      }
      return result
    } catch (err: any) {
      lastError = err
      // Client errors are not transient, so retrying the same request cannot help.
      if (err instanceof APIError && err.status < 500) {
        throw err
      }

      attempt++
      if (attempt < maxRetries) {
        // Exponential backoff: 500ms, 1000ms, 2000ms
        const backoffMs = Math.pow(2, attempt) * 250
        await delay(backoffMs)
      }
    }
  }

  throw lastError || new APIError(500, "Network request failed after maximum retries")
}

// Alias for backwards compatibility
export const submitPrediction = predictBeefQuality

/**
 * Check backend health status
 * @returns Health check response
 */
export async function checkHealth(): Promise<{ status: string; models_loaded: boolean }> {
  const response = await fetch(`${API_URL}/health`)

  if (!response.ok) {
    throw new APIError(response.status, "Health check failed")
  }

  return response.json()
}
