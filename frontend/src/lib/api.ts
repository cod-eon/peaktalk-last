const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

let authRecoveryStarted = false

function redirectToAuthRecovery() {
  if (typeof window === 'undefined' || authRecoveryStarted) return

  authRecoveryStarted = true
  const returnPath = `${window.location.pathname}${window.location.search}`
  window.location.replace(`/api/auth/logto/sign-in?return=${encodeURIComponent(returnPath)}`)
}

async function getAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/access-token', {
      credentials: 'include',
      cache: 'no-store',
    })
    if (!response.ok) return null
    const body = await response.json() as { access_token?: unknown }
    return typeof body.access_token === 'string' ? body.access_token : null
  } catch {
    return null
  }
}

const getDefaultErrorMessage = (status: number) => {
  switch (status) {
    case 400:
      return 'Некорректный запрос.'
    case 401:
      return 'Сессия истекла. Пожалуйста, войдите снова.'
    case 403:
      return 'Нет доступа к ресурсу.'
    case 404:
      return 'Запрошенный ресурс не найден.'
    case 413:
      return 'Файл слишком большой.'
    case 415:
      return 'Неподдерживаемый формат данных.'
    case 429:
      return 'Слишком много запросов. Попробуйте позже.'
    case 500:
      return 'Внутренняя ошибка сервера.'
    case 502:
    case 503:
    case 504:
      return 'Сервис временно недоступен. Попробуйте позже.'
    default:
      return 'Произошла ошибка'
  }
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function parseApiErrorBody(errorData: unknown, fallback: string): { message: string; code?: string } {
  if (!errorData || typeof errorData !== 'object') return { message: fallback }

  const data = errorData as { detail?: unknown; message?: unknown; code?: unknown }
  const code = typeof data.code === 'string' ? data.code : undefined

  if (typeof data.detail === 'string') {
    return { message: data.detail, code }
  }

  if (Array.isArray(data.detail)) {
    return {
      message: data.detail
        .map((e) => {
          if (e && typeof e === 'object' && 'msg' in e && typeof e.msg === 'string') return e.msg
          return JSON.stringify(e)
        })
        .join('; '),
      code,
    }
  }

  if (data.detail && typeof data.detail === 'object') {
    const detail = data.detail as { detail?: unknown; message?: unknown; code?: unknown }
    return {
      message:
        (typeof detail.detail === 'string' && detail.detail) ||
        (typeof detail.message === 'string' && detail.message) ||
        fallback,
      code: typeof detail.code === 'string' ? detail.code : code,
    }
  }

  if (typeof data.message === 'string') return { message: data.message, code }
  return { message: fallback, code }
}

export const api = {
  async get(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: 'GET' })
  },

  async post(endpoint: string, data?: unknown, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  },

  async put(endpoint: string, data?: unknown, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  },

  async patch(endpoint: string, data?: unknown, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  },

  async delete(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  },

  async request(endpoint: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers)

    // Only set Content-Type to JSON if it's not FormData
    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    const accessToken = await getAccessToken()
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      if (response.status === 401) {
        const refreshedToken = await getAccessToken()
        if (refreshedToken && refreshedToken !== accessToken) {
          // Retry the request with the new token
          const retryHeaders = new Headers(options.headers)
          if (!(options.body instanceof FormData)) {
            retryHeaders.set('Content-Type', 'application/json')
          }
          retryHeaders.set('Authorization', `Bearer ${refreshedToken}`)
          const retryResponse = await fetch(`${API_URL}${endpoint}`, { ...options, headers: retryHeaders })
          if (retryResponse.ok) {
            if (retryResponse.status === 204) return null
            const ct = retryResponse.headers.get('content-type')
            return ct?.includes('application/json') ? retryResponse.json() : retryResponse.text()
          }
        }
        
        // A browser session can outlive an unusable API token. Re-enter the
        // Logto flow with clearTokens instead of bouncing through /login,
        // whose authenticated-session guard would send the user back here.
        redirectToAuthRecovery()
        throw new ApiError('Сессия истекла. Пожалуйста, войдите снова.', 401)
      }

      let errorMessage = getDefaultErrorMessage(response.status)
      let errorCode: string | undefined
      try {
        const errorData = await response.json()
        const parsed = parseApiErrorBody(errorData, errorMessage)
        errorMessage = parsed.message
        errorCode = parsed.code
      } catch {
        errorMessage = getDefaultErrorMessage(response.status)
      }
      throw new ApiError(errorMessage, response.status, errorCode)
    }

    // 204 No Content — no body to parse
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return response.json()
    }

    return response.text()
  }
}
