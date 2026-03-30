import type { NormalizedRow } from '../../types'

export type Metrics = {
  interactions: number
  uniqueSessions: number
  uniqueProjects: number
  uniqueIntents: number
  avgResponseSeconds: number | null
  p50ResponseSeconds: number | null
  p90ResponseSeconds: number | null
  handoffCount: number
  riskCount: number
}

export type BucketPoint = { x: string; y: number }
export type GroupCount = { name: string; value: number }

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))))
  return sorted[idx] ?? null
}

function isHandoff(r: NormalizedRow): boolean {
  const t = `${r.intent} ${r.answer}`.toLowerCase()
  return t.includes('转人工') || t.includes('转接人工') || t.includes('人工客服')
}

function isRiskIntent(r: NormalizedRow): boolean {
  const t = r.intent
  return (
    t.includes('投诉') ||
    t.includes('退款') ||
    t.includes('退换') ||
    t.includes('差评') ||
    t.includes('质量') ||
    t.includes('服务态度')
  )
}

export function computeMetrics(rows: NormalizedRow[]): Metrics {
  const sessions = new Set<string>()
  const projects = new Set<string>()
  const intents = new Set<string>()
  const responseSeconds: number[] = []
  let handoffCount = 0
  let riskCount = 0

  for (const r of rows) {
    if (r.sessionId) sessions.add(r.sessionId)
    if (r.projectName) projects.add(r.projectName)
    if (r.intent) intents.add(r.intent)
    if (isHandoff(r)) handoffCount += 1
    if (isRiskIntent(r)) riskCount += 1

    if (r.questionTime && r.answerTime) {
      const ms = r.answerTime.getTime() - r.questionTime.getTime()
      if (Number.isFinite(ms) && ms >= 0) responseSeconds.push(ms / 1000)
    }
  }

  responseSeconds.sort((a, b) => a - b)
  const avgResponseSeconds =
    responseSeconds.length === 0
      ? null
      : responseSeconds.reduce((a, b) => a + b, 0) / responseSeconds.length

  return {
    interactions: rows.length,
    uniqueSessions: sessions.size,
    uniqueProjects: projects.size,
    uniqueIntents: intents.size,
    avgResponseSeconds,
    p50ResponseSeconds: percentile(responseSeconds, 0.5),
    p90ResponseSeconds: percentile(responseSeconds, 0.9),
    handoffCount,
    riskCount,
  }
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function bucketByHour(rows: NormalizedRow[]): BucketPoint[] {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const t = r.questionTime ?? r.answerTime
    if (!t) continue
    const key = `${pad2(t.getMonth() + 1)}-${pad2(t.getDate())} ${pad2(t.getHours())}:00`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([x, y]) => ({ x, y }))
}

export function groupCount(
  rows: NormalizedRow[],
  selector: (r: NormalizedRow) => string,
  topN: number,
): GroupCount[] {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const k = selector(r).trim() || '未命名'
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, value]) => ({ name, value }))
}
