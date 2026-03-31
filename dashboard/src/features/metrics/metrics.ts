import type { NormalizedRow } from '../../types'

export type Metrics = {
  interactions: number
  uniqueSessions: number
  uniqueProjects: number
  uniqueIntents: number
  uniqueQuestions: number
  handoffCount: number
  handoffRate: number
  riskCount: number
  riskRate: number
  unlabeledIntentCount: number
  unlabeledIntentRate: number
  unlabeledProjectCount: number
  unlabeledProjectRate: number
  duplicateQuestionRate: number
  topIntentShare: number
  topProjectShare: number
}

export type BucketPoint = { x: string; y: number }
export type GroupCount = { name: string; value: number }

export type TrendViewType = 'hour' | 'day' | 'week' | 'month'

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

function isUnlabeledIntent(r: NormalizedRow): boolean {
  const v = r.intent.trim()
  if (!v) return true
  if (/^\d+$/.test(v)) return true
  return false
}

function isUnlabeledProject(r: NormalizedRow): boolean {
  return r.projectName.trim() === ''
}

function normalizeQuestion(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replaceAll(/\s+/g, '')
    .replaceAll(/[，。！？、；：,.!?;:()[\]{}"'“”‘’`~@#$%^&*+=<>/\\|-]/g, '')
}

export function computeMetrics(rows: NormalizedRow[]): Metrics {
  const sessions = new Set<string>()
  const projects = new Set<string>()
  const intents = new Set<string>()
  const questions = new Set<string>()
  const intentCounts = new Map<string, number>()
  const projectCounts = new Map<string, number>()
  let handoffCount = 0
  let riskCount = 0
  let unlabeledIntentCount = 0
  let unlabeledProjectCount = 0

  for (const r of rows) {
    if (r.sessionId) sessions.add(r.sessionId)
    if (r.projectName) projects.add(r.projectName)
    if (r.intent) intents.add(r.intent)
    if (isHandoff(r)) handoffCount += 1
    if (isRiskIntent(r)) riskCount += 1
    if (isUnlabeledIntent(r)) unlabeledIntentCount += 1
    if (isUnlabeledProject(r)) unlabeledProjectCount += 1

    const q = normalizeQuestion(r.question)
    if (q) questions.add(q)

    const intentKey = r.intent.trim() || '未标注'
    intentCounts.set(intentKey, (intentCounts.get(intentKey) ?? 0) + 1)

    const projectKey = r.projectName.trim() || '未标注'
    projectCounts.set(projectKey, (projectCounts.get(projectKey) ?? 0) + 1)
  }

  const interactions = rows.length
  const safeDiv = (n: number, d: number) => (d <= 0 ? 0 : n / d)
  const maxCount = (m: Map<string, number>) => {
    let max = 0
    for (const v of m.values()) if (v > max) max = v
    return max
  }

  return {
    interactions,
    uniqueSessions: sessions.size,
    uniqueProjects: projects.size,
    uniqueIntents: intents.size,
    uniqueQuestions: questions.size,
    handoffCount,
    riskCount,
    handoffRate: safeDiv(handoffCount, interactions),
    riskRate: safeDiv(riskCount, interactions),
    unlabeledIntentCount,
    unlabeledIntentRate: safeDiv(unlabeledIntentCount, interactions),
    unlabeledProjectCount,
    unlabeledProjectRate: safeDiv(unlabeledProjectCount, interactions),
    duplicateQuestionRate: safeDiv(interactions - questions.size, interactions),
    topIntentShare: safeDiv(maxCount(intentCounts), interactions),
    topProjectShare: safeDiv(maxCount(projectCounts), interactions),
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

export function bucketByDay(rows: NormalizedRow[]): BucketPoint[] {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const t = r.questionTime ?? r.answerTime
    if (!t) continue
    const key = `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([x, y]) => ({ x, y }))
}

export function bucketByWeek(rows: NormalizedRow[]): BucketPoint[] {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const t = r.questionTime ?? r.answerTime
    if (!t) continue
    const weekStart = new Date(t)
    const day = weekStart.getDay()
    const diff = day === 0 ? 6 : day - 1
    weekStart.setDate(weekStart.getDate() - diff)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const key = `${weekStart.getFullYear()}-W${getWeekNumber(weekStart)}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([x, y]) => ({ x, y }))
}

export function bucketByMonth(rows: NormalizedRow[]): BucketPoint[] {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const t = r.questionTime ?? r.answerTime
    if (!t) continue
    const key = `${t.getFullYear()}-${pad2(t.getMonth() + 1)}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([x, y]) => ({ x, y }))
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function bucketTrendByView(rows: NormalizedRow[], viewType: TrendViewType): BucketPoint[] {
  switch (viewType) {
    case 'hour':
      return bucketByHour(rows)
    case 'day':
      return bucketByDay(rows)
    case 'week':
      return bucketByWeek(rows)
    case 'month':
      return bucketByMonth(rows)
    default:
      return bucketByHour(rows)
  }
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
