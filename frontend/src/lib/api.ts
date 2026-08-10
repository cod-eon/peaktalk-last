const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const AUTH_RECOVERY_STORAGE_KEY = 'peaktalk_auth_recovery_started_at'
const AUTH_RECOVERY_COOLDOWN_MS = 30_000

function redirectToAuthRecovery() {
  if (typeof window === 'undefined') return false

  const startedAt = Number(window.sessionStorage.getItem(AUTH_RECOVERY_STORAGE_KEY) || 0)
  if (startedAt > 0 && Date.now() - startedAt < AUTH_RECOVERY_COOLDOWN_MS) return false

  window.sessionStorage.setItem(AUTH_RECOVERY_STORAGE_KEY, String(Date.now()))
  const returnPath = `${window.location.pathname}${window.location.search}`
  window.location.replace(`/api/auth/logto/sign-in?return=${encodeURIComponent(returnPath)}`)
  return true
}

type AccessCredentials = {
  accessToken: string
  identityAssertion: string | null
}

async function getAccessCredentials(): Promise<AccessCredentials | null> {
  try {
    const response = await fetch('/api/auth/access-token', {
      credentials: 'include',
      cache: 'no-store',
    })
    if (!response.ok) {
      if (response.status === 403) {
        try {
          const errorData = await response.json()
          const parsed = parseApiErrorBody(errorData, 'Подтвердите email, чтобы продолжить.')
          if (parsed.code === 'email_verification_required') {
            throw new ApiError(parsed.message, response.status, parsed.code)
          }
        } catch (error) {
          if (error instanceof ApiError) throw error
        }
      }
      return null
    }
    const body = await response.json() as { access_token?: unknown; identity_assertion?: unknown }
    if (typeof body.access_token !== 'string') return null
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(AUTH_RECOVERY_STORAGE_KEY)
    }
    return {
      accessToken: body.access_token,
      identityAssertion: typeof body.identity_assertion === 'string' ? body.identity_assertion : null,
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
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

type ApiRequestOptions = RequestInit & {
  skipAuthRecovery?: boolean
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
  async get(endpoint: string, options: ApiRequestOptions = {}) {
    return this.request(endpoint, { ...options, method: 'GET' })
  },

  async post(endpoint: string, data?: unknown, options: ApiRequestOptions = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  },

  async put(endpoint: string, data?: unknown, options: ApiRequestOptions = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  },

  async patch(endpoint: string, data?: unknown, options: ApiRequestOptions = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  },

  async delete(endpoint: string, options: ApiRequestOptions = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  },

  async request(endpoint: string, options: ApiRequestOptions = {}) {
    const { skipAuthRecovery = false, ...requestOptions } = options
    const headers = new Headers(requestOptions.headers)

    // Only set Content-Type to JSON if it's not FormData
    if (!(requestOptions.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    const credentials = await getAccessCredentials()
    const accessToken = credentials?.accessToken ?? null
    if (credentials) {
      headers.set('Authorization', `Bearer ${credentials.accessToken}`)
      if (credentials.identityAssertion) {
        headers.set('X-PeakTalk-Identity', credentials.identityAssertion)
      }
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...requestOptions,
      headers,
    })

    if (!response.ok) {
      if (response.status === 401) {
        const refreshedCredentials = await getAccessCredentials()
        const refreshedToken = refreshedCredentials?.accessToken ?? null
        if (
          refreshedCredentials &&
          refreshedToken &&
          (refreshedToken !== accessToken || refreshedCredentials.identityAssertion !== credentials?.identityAssertion)
        ) {
          // Retry the request with the new token
          const retryHeaders = new Headers(requestOptions.headers)
          if (!(requestOptions.body instanceof FormData)) {
            retryHeaders.set('Content-Type', 'application/json')
          }
          retryHeaders.set('Authorization', `Bearer ${refreshedToken}`)
          if (refreshedCredentials.identityAssertion) {
            retryHeaders.set('X-PeakTalk-Identity', refreshedCredentials.identityAssertion)
          }
          const retryResponse = await fetch(`${API_URL}${endpoint}`, { ...requestOptions, headers: retryHeaders })
          if (retryResponse.ok) {
            if (retryResponse.status === 204) return null
            const ct = retryResponse.headers.get('content-type')
            return ct?.includes('application/json') ? retryResponse.json() : retryResponse.text()
          }
        }
        
        // A browser session can outlive an unusable API token. Re-enter the
        // Logto flow with clearTokens instead of bouncing through /login,
        // whose authenticated-session guard would send the user back here.
        if (!skipAuthRecovery) {
          redirectToAuthRecovery()
        }
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
