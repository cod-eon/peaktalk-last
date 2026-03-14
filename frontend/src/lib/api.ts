import { createClient } from './supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
        // Handle common backend errors (FastAPI sends `{ "detail": "..." }`)
        let errorMessage = 'An error occurred'
        try {
            const errorData = await response.json()
            errorMessage = errorData.detail || errorData.message || errorMessage
        } catch {
            // Error parsing json, fallback to status text
            errorMessage = response.statusText
        }
        throw new Error(errorMessage)
    }

    // Attempt to parse json
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
        return response.json()
    }

    return response.text()
  }
}
