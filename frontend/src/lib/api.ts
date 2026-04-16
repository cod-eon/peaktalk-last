import { createClient } from './supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const headers = new Headers(options.headers)

    // Only set Content-Type to JSON if it's not FormData
    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`)
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Try getting session again (it might have been refreshed by another concurrent request)
        const supabase = createClient()
        let { data: { session: refreshedSession } } = await supabase.auth.getSession()

        if (refreshedSession?.access_token === session?.access_token) {
          const { data } = await supabase.auth.refreshSession()
          refreshedSession = data.session
        }

        if (refreshedSession?.access_token) {
          // Retry the request with the new token
          const retryHeaders = new Headers(options.headers)
          if (!(options.body instanceof FormData)) {
            retryHeaders.set('Content-Type', 'application/json')
          }
          retryHeaders.set('Authorization', `Bearer ${refreshedSession.access_token}`)
          const retryResponse = await fetch(`${API_URL}${endpoint}`, { ...options, headers: retryHeaders })
          if (retryResponse.ok) {
            if (retryResponse.status === 204) return null
            const ct = retryResponse.headers.get('content-type')
            return ct?.includes('application/json') ? retryResponse.json() : retryResponse.text()
          }
        }
        
        // If we reach here, session is truly invalid
        await supabase.auth.signOut()
        if (typeof window !== 'undefined') {
          // Use safe redirect that preserves Next.js router cache limits
          window.location.replace('/login')
        }
        throw new Error('Сессия истекла. Пожалуйста, войдите снова.')
      }

      let errorMessage = getDefaultErrorMessage(response.status)
      try {
        const errorData = await response.json()
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail
        } else if (Array.isArray(errorData.detail)) {
          // FastAPI validation errors: [{loc, msg, type}]
          errorMessage = errorData.detail
            .map((e: { msg?: string }) => e.msg ?? JSON.stringify(e))
            .join('; ')
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message
        }
      } catch {
        errorMessage = getDefaultErrorMessage(response.status)
      }
      throw new Error(errorMessage)
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
