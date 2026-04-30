import { ApiError, parseApiErrorBody } from './api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface GuestStartResponse {
  guest_session_id: string
  first_question: string
  limit_reached?: boolean
}

export interface GuestMessageResponse {
  question?: string
  limit_reached: boolean
}

export async function startGuestSession(
  text: string,
  persona: string,
  difficulty: number
): Promise<GuestStartResponse> {
  const res = await fetch(`${API_BASE}/simulation/guest-start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, persona, difficulty }),
  })
  if (!res.ok) {
    let msg = 'Не удалось запустить гостевую сессию'
    let code: string | undefined
    try {
      const data = await res.json()
      const parsed = parseApiErrorBody(data, msg)
      msg = parsed.message
      code = parsed.code
    } catch {
      // ignore
    }
    throw new ApiError(msg, res.status, code)
  }
  return res.json()
}

export async function sendGuestMessage(
  guestSessionId: string,
  content: string
): Promise<GuestMessageResponse> {
  const res = await fetch(`${API_BASE}/simulation/guest-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guest_session_id: guestSessionId, content }),
  })
  if (!res.ok) {
    let msg = 'Не удалось отправить сообщение'
    let code: string | undefined
    try {
      const data = await res.json()
      const parsed = parseApiErrorBody(data, msg)
      msg = parsed.message
      code = parsed.code
    } catch {
      // ignore
    }
    throw new ApiError(msg, res.status, code)
  }
  return res.json()
}
