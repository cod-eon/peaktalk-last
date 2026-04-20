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
    try {
      const data = await res.json()
      if (typeof data.detail === 'string') msg = data.detail
    } catch {
      // ignore
    }
    throw new Error(msg)
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
    try {
      const data = await res.json()
      if (typeof data.detail === 'string') msg = data.detail
    } catch {
      // ignore
    }
    throw new Error(msg)
  }
  return res.json()
}
