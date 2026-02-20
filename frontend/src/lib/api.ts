const API_BASE = '/api'

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error('Health check failed')
  return res.json()
}

export async function fetchRoot() {
  const res = await fetch(API_BASE)
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}
