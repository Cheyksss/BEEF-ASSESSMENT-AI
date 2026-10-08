import { PredictionResponse } from "@/types"

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

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers,
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage =
          errorData.detail || `Server returned error status ${response.status}`

        // Do not retry 400 (Bad Request) or 401 (Unauthorized)
        if (response.status === 400 || response.status === 401) {
          throw new APIError(response.status, errorMessage)
        }

        // 5xx errors can be transient, throw to retry
        throw new APIError(response.status, errorMessage)
      }

      return (await response.json()) as PredictionResponse
    } catch (err: any) {
      lastError = err
      // If it's a client error (400, 401), re-throw immediately
      if (err instanceof APIError && (err.status === 400 || err.status === 401)) {
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
