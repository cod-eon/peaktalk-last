const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Scenario {
  id: string
  slug: string
  title: string
  subtitle: string
  category: string
  persona: string
  difficulty: number
  recommended_difficulty?: number
  situation?: string
}

export interface ScenarioCategory {
  id: string
  label: string
  count: number
}

export interface ScenariosListResponse {
  items: Scenario[]
  total: number
}

export interface StartFromScenarioResponse {
  id: string
}

async function fetchPublic<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    let msg = 'Ошибка загрузки данных'
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

export async function getScenarios(category?: string): Promise<ScenariosListResponse> {
  const query = category ? `?category=${encodeURIComponent(category)}` : ''
  return fetchPublic<ScenariosListResponse>(`/scenarios${query}`)
}

export async function getScenario(slug: string): Promise<Scenario> {
  return fetchPublic<Scenario>(`/scenarios/${slug}`)
}

export async function getScenarioCategories(): Promise<ScenarioCategory[]> {
  return fetchPublic<ScenarioCategory[]>('/scenarios/categories')
}

export async function startFromScenario(
  scenarioId: string,
  difficulty: number,
  accessToken: string
): Promise<StartFromScenarioResponse> {
  const res = await fetch(`${API_BASE}/simulation/start-from-scenario`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ scenario_id: scenarioId, difficulty }),
  })
  if (!res.ok) {
    let msg = 'Не удалось запустить симуляцию'
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
