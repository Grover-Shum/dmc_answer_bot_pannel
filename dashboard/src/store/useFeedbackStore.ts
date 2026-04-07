import { create } from 'zustand'

const countsKey = 'agent_dashboard_feedback_counts'
const dedupeKey = 'agent_dashboard_feedback_dedupe'

export type FeedbackCounts = {
  up: number
  down: number
}

type FeedbackType = 'up' | 'down'

function readCounts(): FeedbackCounts {
  if (typeof window === 'undefined') return { up: 0, down: 0 }
  const raw = window.localStorage.getItem(countsKey)
  if (!raw) return { up: 0, down: 0 }
  try {
    const data = JSON.parse(raw) as Partial<FeedbackCounts>
    const up = typeof data.up === 'number' && Number.isFinite(data.up) ? Math.max(0, Math.floor(data.up)) : 0
    const down = typeof data.down === 'number' && Number.isFinite(data.down) ? Math.max(0, Math.floor(data.down)) : 0
    return { up, down }
  } catch {
    return { up: 0, down: 0 }
  }
}

function writeCounts(v: FeedbackCounts) {
  window.localStorage.setItem(countsKey, JSON.stringify(v))
}

function shouldDedupe(type: FeedbackType): boolean {
  if (typeof window === 'undefined') return false
  const now = Date.now()
  const raw = window.sessionStorage.getItem(dedupeKey)
  if (!raw) return false
  try {
    const data = JSON.parse(raw) as { type?: string; at?: number }
    if (data.type !== type) return false
    if (typeof data.at !== 'number') return false
    return now - data.at < 2000
  } catch {
    return false
  }
}

function markDedupe(type: FeedbackType) {
  window.sessionStorage.setItem(dedupeKey, JSON.stringify({ type, at: Date.now() }))
}

export type FeedbackState = {
  counts: FeedbackCounts
  inc: (type: FeedbackType) => void
  reset: () => void
  refresh: () => void
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  counts: readCounts(),
  inc: (type) => {
    if (typeof window !== 'undefined') {
      if (shouldDedupe(type)) return
      markDedupe(type)
    }
    const curr = readCounts()
    const next: FeedbackCounts =
      type === 'up'
        ? { up: curr.up + 1, down: curr.down }
        : { up: curr.up, down: curr.down + 1 }
    if (typeof window !== 'undefined') writeCounts(next)
    set({ counts: next })
  },
  reset: () => {
    const next: FeedbackCounts = { up: 0, down: 0 }
    if (typeof window !== 'undefined') writeCounts(next)
    set({ counts: next })
  },
  refresh: () => {
    set({ counts: readCounts() })
  },
}))
