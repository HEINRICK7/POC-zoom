const EXTERNAL_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL

// Track backend availability
let backendAvailable: boolean | null = null
let lastCheckTime = 0
const CHECK_INTERVAL = 30000 // Check every 30 seconds

export function getApiUrl(endpoint: string): string {
  // If external backend is configured, use it
  if (EXTERNAL_BACKEND_URL) {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint
    return `${EXTERNAL_BACKEND_URL}/${cleanEndpoint}`
  }

  // Otherwise use local Next.js API routes
  return endpoint.startsWith("/") ? endpoint : `/${endpoint}`
}

export async function fetchWithFallback(endpoint: string, options?: RequestInit): Promise<Response> {
  const externalUrl = EXTERNAL_BACKEND_URL
    ? `${EXTERNAL_BACKEND_URL}/${endpoint.startsWith("/") ? endpoint.slice(1) : endpoint}`
    : null
  const localUrl = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

  // If no external backend configured, use local routes directly
  if (!externalUrl) {
    console.log("[v0] Using local API route:", localUrl)
    return fetch(localUrl, options)
  }

  // Check if we should try external backend
  const now = Date.now()
  const shouldCheckBackend = backendAvailable === null || now - lastCheckTime > CHECK_INTERVAL

  // If backend was recently confirmed unavailable, skip to local
  if (backendAvailable === false && !shouldCheckBackend) {
    console.log("[v0] Using local API (external backend unavailable):", localUrl)
    return fetch(localUrl, options)
  }

  // Try external backend first
  try {
    console.log("[v0] Attempting external backend:", externalUrl)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(externalUrl, {
      ...options,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // If successful, mark backend as available
    backendAvailable = true
    lastCheckTime = now
    console.log("[v0] External backend responded successfully")
    return response
  } catch (error) {
    // External backend failed, mark as unavailable and fallback to local
    console.log(
      "[v0] External backend failed, falling back to local API:",
      error instanceof Error ? error.message : String(error),
    )
    backendAvailable = false
    lastCheckTime = now

    // Use local API route as fallback
    return fetch(localUrl, options)
  }
}

export function getBackendUrl(): string {
  return EXTERNAL_BACKEND_URL || window.location.origin
}

export function isExternalBackendEnabled(): boolean {
  return !!EXTERNAL_BACKEND_URL
}

export function getBackendStatus(): { enabled: boolean; url: string | null; available: boolean | null } {
  return {
    enabled: !!EXTERNAL_BACKEND_URL,
    url: EXTERNAL_BACKEND_URL || null,
    available: backendAvailable,
  }
}
