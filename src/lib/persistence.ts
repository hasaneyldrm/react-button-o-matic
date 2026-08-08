export interface PersistedState {
  winnerId: string
  count: number
}

export function readPersisted(key: string | undefined): PersistedState | null {
  if (!key || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedState
    if (typeof parsed?.winnerId !== 'string') return null
    return { winnerId: parsed.winnerId, count: Number(parsed.count) || 0 }
  } catch {
    return null
  }
}

export function writePersisted(
  key: string | undefined,
  state: PersistedState | null,
) {
  if (!key || typeof window === 'undefined') return
  try {
    if (state === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(state))
  } catch {
    /* storage unavailable */
  }
}
