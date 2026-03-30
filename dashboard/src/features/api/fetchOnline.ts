import type { NormalizedRow, RawRow } from '../../types'

type WorkflowRunResponse = {
  code: number
  msg: string
  data?: string
  debug_url?: string
  execute_id?: string
}

type WorkflowPayload = {
  meta?: RawRow[]
}

function parseApiTime(v: unknown): Date | null {
  if (v == null) return null
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v
  const s = String(v).trim()
  const m =
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\s+([+-]\d{4})\s+\w+$/.exec(s)
  if (m) {
    const y = Number(m[1])
    const mo = Number(m[2])
    const d = Number(m[3])
    const hh = Number(m[4])
    const mm = Number(m[5])
    const ss = Number(m[6])
    const tz = m[7]
    const sign = tz.startsWith('-') ? -1 : 1
    const tzHours = Number(tz.slice(1, 3))
    const tzMins = Number(tz.slice(3, 5))
    const offsetMinutes = sign * (tzHours * 60 + tzMins)
    const utcMs = Date.UTC(y, mo - 1, d, hh, mm, ss) - offsetMinutes * 60 * 1000
    const dt = new Date(utcMs)
    return Number.isNaN(dt.getTime()) ? null : dt
  }
  const ms = Date.parse(s)
  if (!Number.isNaN(ms)) return new Date(ms)
  return null
}

function toStringSafe(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return String(v)
}

export async function fetchOnlineRows(): Promise<{
  fileName: string
  sheetNames: string[]
  activeSheet: string
  rows: NormalizedRow[]
  columns: string[]
}> {
  const res = await fetch('/api/workflow', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  const contentType = res.headers.get('content-type') ?? ''
  const bodyText = await res.text()

  let json: WorkflowRunResponse
  try {
    json = JSON.parse(bodyText) as WorkflowRunResponse
  } catch {
    const preview = bodyText.slice(0, 40).replaceAll('\n', ' ')
    if (preview.startsWith('export')) {
      throw new Error('当前环境未启用 /api/workflow（请在 Vercel 部署后访问，或使用 vercel dev）')
    }
    throw new Error(`线上接口返回非 JSON：${preview}`)
  }

  if (!res.ok) {
    throw new Error(json?.msg || `请求失败（HTTP ${res.status}）`)
  }
  if (json.code !== 0) throw new Error(json.msg || '接口返回异常')
  if (!json.data) {
    return { fileName: 'online', sheetNames: ['meta'], activeSheet: 'meta', rows: [], columns: [] }
  }

  let payload: WorkflowPayload
  try {
    payload = JSON.parse(json.data) as WorkflowPayload
  } catch {
    throw new Error('接口 data 字段不是合法 JSON 字符串')
  }

  const raw = Array.isArray(payload.meta) ? payload.meta : []
  const rows: NormalizedRow[] = raw.map((r, idx) => {
    const sessionId = toStringSafe(r.session_id).trim() || `row_${idx + 1}`
    const question = toStringSafe(r.question).trim()
    const answer = toStringSafe(r.answer).trim()
    const questionTime = parseApiTime(r.question_time)
    const answerTime = parseApiTime(r.answer_time)
    const intent = toStringSafe(r.intent).trim()
    const projectName = toStringSafe(r.project_name).trim()
    return {
      sessionId,
      question,
      answer,
      questionTime,
      answerTime,
      intent,
      projectName,
      raw: r,
    }
  })

  const columns = raw.length > 0 ? Object.keys(raw[0] ?? {}).filter(Boolean) : []
  return { fileName: 'online', sheetNames: ['meta'], activeSheet: 'meta', rows, columns }
}
