import * as XLSX from 'xlsx'
import type { NormalizedRow, RawRow } from '../../types'

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]/g, '')
}

function pickValue(row: RawRow, candidates: string[]): unknown {
  const normToOriginal: Record<string, string> = {}
  for (const k of Object.keys(row)) {
    normToOriginal[normalizeKey(k)] = k
  }
  for (const c of candidates) {
    const hit = normToOriginal[normalizeKey(c)]
    if (hit != null) return row[hit]
  }
  return undefined
}

function toStringSafe(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (v instanceof Date) return v.toISOString()
  return String(v)
}

function parseMDYTime(s: string): Date | null {
  const t = s.trim()
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(
    t,
  )
  if (!m) {
    const ms = Date.parse(t)
    if (!Number.isNaN(ms)) return new Date(ms)
    return null
  }
  const month = Number(m[1])
  const day = Number(m[2])
  const yearRaw = Number(m[3])
  const hour = Number(m[4])
  const minute = Number(m[5])
  const second = m[6] ? Number(m[6]) : 0
  const year =
    yearRaw < 100 ? (yearRaw <= 69 ? 2000 + yearRaw : 1900 + yearRaw) : yearRaw
  const d = new Date(year, month - 1, day, hour, minute, second, 0)
  return Number.isNaN(d.getTime()) ? null : d
}

function toDateSafe(v: unknown): Date | null {
  if (v == null) return null
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v
  if (typeof v === 'number') {
    const parsed = XLSX.SSF.parse_date_code(v)
    if (!parsed) return null
    const d = new Date(
      parsed.y,
      parsed.m - 1,
      parsed.d,
      parsed.H,
      parsed.M,
      Math.floor(parsed.S),
      0,
    )
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof v === 'string') return parseMDYTime(v)
  return null
}

export async function parseXlsxFile(file: File): Promise<{
  sheetNames: string[]
  activeSheet: string
  columns: string[]
  rows: NormalizedRow[]
}> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', cellDates: true })
  const sheetNames = wb.SheetNames
  const activeSheet = sheetNames[0] ?? 'Sheet1'
  const sheet = wb.Sheets[activeSheet]

  const rawRows = XLSX.utils.sheet_to_json<RawRow>(sheet, {
    defval: null,
    raw: true,
  })

  const columns =
    rawRows.length > 0
      ? Array.from(
          rawRows.reduce((acc, row) => {
            for (const k of Object.keys(row)) acc.add(k)
            return acc
          }, new Set<string>()),
        )
      : []

  const rows: NormalizedRow[] = rawRows.map((r, idx) => {
    const sessionId = toStringSafe(
      pickValue(r, ['session_id', 'sessionId', 'session', '会话id', '会话']),
    ).trim()
    const question = toStringSafe(pickValue(r, ['question', '问题', '提问'])).trim()
    const answer = toStringSafe(pickValue(r, ['answer', '回答', '回复'])).trim()
    const questionTime = toDateSafe(
      pickValue(r, ['question_time', 'questionTime', '提问时间', '问询时间']),
    )
    const answerTime = toDateSafe(
      pickValue(r, ['answer_time', 'answerTime', '回答时间', '回复时间']),
    )
    const intent = toStringSafe(pickValue(r, ['intent', '意图', '标签'])).trim()
    const projectName = toStringSafe(
      pickValue(r, ['project_name', 'projectName', '项目', '项目名']),
    ).trim()

    return {
      sessionId: sessionId || `row_${idx + 1}`,
      question,
      answer,
      questionTime,
      answerTime,
      intent,
      projectName,
      raw: r,
    }
  })

  return { sheetNames, activeSheet, columns, rows }
}
