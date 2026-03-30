import { useMemo, useState, useDeferredValue } from 'react'
import { useNavigate } from 'react-router-dom'
import { bucketByHour, computeMetrics, groupCount } from '../../features/metrics/metrics'
import { useDataStore } from '../../store/useDataStore'
import { useUiStore } from '../../store/useUiStore'
import type { NormalizedRow } from '../../types'
import { ChartCard } from '../components/ChartCard'
import { KpiCard } from '../components/KpiCard'
import { Modal } from '../components/Modal'

function formatSeconds(v: number | null): string {
  if (v == null) return '-'
  if (v < 1) return `${Math.round(v * 1000)} ms`
  if (v < 60) return `${v.toFixed(1)} s`
  return `${(v / 60).toFixed(1)} min`
}

function toDatetimeLocalValue(d: Date): string {
  const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}`
}

function fromDatetimeLocalValue(v: string): Date | null {
  if (!v) return null
  const ms = Date.parse(v)
  if (Number.isNaN(ms)) return null
  return new Date(ms)
}

function sortByTimeDesc(a: NormalizedRow, b: NormalizedRow): number {
  const ta = (a.questionTime ?? a.answerTime)?.getTime() ?? 0
  const tb = (b.questionTime ?? b.answerTime)?.getTime() ?? 0
  return tb - ta
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { rows } = useDataStore()
  const theme = useUiStore((s) => s.theme)

  const allProjects = useMemo(() => {
    const s = new Set<string>()
    for (const r of rows) if (r.projectName) s.add(r.projectName)
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const allIntents = useMemo(() => {
    const s = new Set<string>()
    for (const r of rows) if (r.intent) s.add(r.intent)
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const timeBounds = useMemo(() => {
    let min: Date | null = null
    let max: Date | null = null
    for (const r of rows) {
      const t = r.questionTime ?? r.answerTime
      if (!t) continue
      if (!min || t.getTime() < min.getTime()) min = t
      if (!max || t.getTime() > max.getTime()) max = t
    }
    return { min, max }
  }, [rows])

  const defaultFromTime = useMemo(() => {
    return timeBounds.min ? toDatetimeLocalValue(timeBounds.min) : ''
  }, [timeBounds.min])

  const defaultToTime = useMemo(() => {
    return timeBounds.max ? toDatetimeLocalValue(timeBounds.max) : ''
  }, [timeBounds.max])

  const [project, setProject] = useState<string>('全部')
  const [intent, setIntent] = useState<string>('全部')
  const [keyword, setKeyword] = useState<string>('')
  const keywordDeferred = useDeferredValue(keyword)
  const [fromTime, setFromTime] = useState<string>('')
  const [toTime, setToTime] = useState<string>('')
  const [selectedRow, setSelectedRow] = useState<NormalizedRow | null>(null)

  const filteredRows = useMemo(() => {
    const kw = keywordDeferred.trim()
    const from = fromDatetimeLocalValue(fromTime || defaultFromTime)
    const to = fromDatetimeLocalValue(toTime || defaultToTime)
    return rows.filter((r) => {
      if (project !== '全部' && r.projectName !== project) return false
      if (intent !== '全部' && r.intent !== intent) return false
      if (kw) {
        const t = `${r.question} ${r.answer}`
        if (!t.includes(kw)) return false
      }
      const t = r.questionTime ?? r.answerTime
      if (from && t && t.getTime() < from.getTime()) return false
      if (to && t && t.getTime() > to.getTime()) return false
      return true
    })
  }, [rows, project, intent, keywordDeferred, fromTime, toTime, defaultFromTime, defaultToTime])

  const metrics = useMemo(() => computeMetrics(filteredRows), [filteredRows])
  const trend = useMemo(() => bucketByHour(filteredRows), [filteredRows])
  const intentsTop = useMemo(
    () => groupCount(filteredRows, (r) => r.intent || '未标注', 12),
    [filteredRows],
  )
  const projectsTop = useMemo(
    () => groupCount(filteredRows, (r) => r.projectName || '未标注', 12),
    [filteredRows],
  )

  const latestRows = useMemo(() => {
    return filteredRows.slice().sort(sortByTimeDesc).slice(0, 50)
  }, [filteredRows])

  const axisLabelColor = theme === 'dark' ? 'rgba(255,255,255,0.72)' : 'rgba(15,23,42,0.72)'
  const axisLineColor = theme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.14)'
  const splitLineColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'
  const tooltipBg = theme === 'dark' ? 'rgba(17,24,39,0.94)' : 'rgba(255,255,255,0.96)'
  const tooltipText = theme === 'dark' ? 'rgba(255,255,255,0.86)' : 'rgba(15,23,42,0.9)'
  const tooltipBorder = theme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.14)'

  const trendOption = useMemo(() => {
    return {
      color: ['#7c5cff'],
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: tooltipText },
      },
      grid: { left: 42, right: 20, top: 26, bottom: 34 },
      xAxis: {
        type: 'category',
        data: trend.map((p) => p.x),
        axisLabel: { color: axisLabelColor },
        axisLine: { lineStyle: { color: axisLineColor } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: axisLabelColor },
        splitLine: { lineStyle: { color: splitLineColor } },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
        { type: 'slider', xAxisIndex: 0, height: 18, bottom: 6 },
      ],
      series: [
        {
          type: 'line',
          smooth: true,
          data: trend.map((p) => p.y),
          showSymbol: false,
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.18 },
        },
      ],
    }
  }, [trend, axisLabelColor, axisLineColor, splitLineColor, tooltipBg, tooltipBorder, tooltipText])

  const intentsOption = useMemo(() => {
    return {
      color: ['#22c55e'],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: tooltipText },
      },
      grid: { left: 150, right: 18, top: 18, bottom: 18 },
      xAxis: {
        type: 'value',
        axisLabel: { color: axisLabelColor },
        splitLine: { lineStyle: { color: splitLineColor } },
      },
      yAxis: {
        type: 'category',
        data: intentsTop.map((d) => d.name),
        inverse: true,
        axisLabel: { color: axisLabelColor },
        axisLine: { lineStyle: { color: axisLineColor } },
      },
      series: [
        { type: 'bar', data: intentsTop.map((d) => d.value), barMaxWidth: 14 },
      ],
    }
  }, [
    intentsTop,
    axisLabelColor,
    axisLineColor,
    splitLineColor,
    tooltipBg,
    tooltipBorder,
    tooltipText,
  ])

  const projectsOption = useMemo(() => {
    return {
      color: ['#60a5fa'],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: tooltipText },
      },
      grid: { left: 150, right: 18, top: 18, bottom: 18 },
      xAxis: {
        type: 'value',
        axisLabel: { color: axisLabelColor },
        splitLine: { lineStyle: { color: splitLineColor } },
      },
      yAxis: {
        type: 'category',
        data: projectsTop.map((d) => d.name),
        inverse: true,
        axisLabel: { color: axisLabelColor },
        axisLine: { lineStyle: { color: axisLineColor } },
      },
      series: [
        { type: 'bar', data: projectsTop.map((d) => d.value), barMaxWidth: 14 },
      ],
    }
  }, [
    projectsTop,
    axisLabelColor,
    axisLineColor,
    splitLineColor,
    tooltipBg,
    tooltipBorder,
    tooltipText,
  ])

  const resultText = useMemo(() => {
    const total = rows.length
    const shown = filteredRows.length
    return `显示 ${shown} / ${total}`
  }, [rows.length, filteredRows.length])

  const canReset = useMemo(() => {
    if (project !== '全部') return true
    if (intent !== '全部') return true
    if (keyword.trim()) return true
    if (fromTime) return true
    if (toTime) return true
    return false
  }, [project, intent, keyword, fromTime, toTime])

  function resetFilters() {
    setProject('全部')
    setIntent('全部')
    setKeyword('')
    setFromTime('')
    setToTime('')
  }

  function exportCsv() {
    const header = ['session_id', 'question_time', 'answer_time', 'project_name', 'intent', 'question', 'answer']
    const rowsOut = filteredRows.map((r) => [
      r.sessionId,
      r.questionTime ? r.questionTime.toISOString() : '',
      r.answerTime ? r.answerTime.toISOString() : '',
      r.projectName,
      r.intent,
      r.question,
      r.answer,
    ])
    const esc = (v: string) => `"${v.replaceAll('"', '""')}"`
    const csv = [header.map(esc).join(','), ...rowsOut.map((row) => row.map((v) => esc(v ?? '')).join(','))].join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agent_dashboard_${new Date().toISOString().slice(0, 19).replaceAll(':', '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (rows.length === 0) {
    return (
      <div className="page">
        <div className="card">
          <div className="card-title">还没有数据</div>
          <div className="card-subtitle">先导入 Excel 数据，再查看看板。</div>
          <button className="btn" onClick={() => navigate('/')}>
            去上传
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="card card-sticky">
        <div className="card-head">
          <div>
            <div className="card-title">筛选</div>
            <div className="card-subtitle">{resultText}</div>
          </div>
          <div className="card-actions">
            <button className="btn btn-secondary" onClick={exportCsv} disabled={filteredRows.length === 0}>
              导出 CSV
            </button>
            <button className="btn" onClick={resetFilters} disabled={!canReset}>
              重置
            </button>
          </div>
        </div>
        <div className="filters">
          <div className="field">
            <div className="label">项目</div>
            <select value={project} onChange={(e) => setProject(e.target.value)}>
              <option value="全部">全部</option>
              {allProjects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <div className="label">意图</div>
            <select value={intent} onChange={(e) => setIntent(e.target.value)}>
              <option value="全部">全部</option>
              {allIntents.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <div className="label">关键词</div>
            <div className="input-wrap">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="匹配问题/回答"
              />
              {keyword ? (
                <button className="icon-btn input-clear" onClick={() => setKeyword('')} aria-label="清空关键词">
                  ×
                </button>
              ) : null}
            </div>
          </div>
          <div className="field">
            <div className="label">开始</div>
            <input
              type="datetime-local"
              value={fromTime || defaultFromTime}
              onChange={(e) => setFromTime(e.target.value)}
            />
          </div>
          <div className="field">
            <div className="label">结束</div>
            <input
              type="datetime-local"
              value={toTime || defaultToTime}
              onChange={(e) => setToTime(e.target.value)}
            />
          </div>
        </div>
        <div className="chips">
          {project !== '全部' ? (
            <button className="chip" onClick={() => setProject('全部')}>
              项目：{project} <span className="chip-x">×</span>
            </button>
          ) : null}
          {intent !== '全部' ? (
            <button className="chip" onClick={() => setIntent('全部')}>
              意图：{intent} <span className="chip-x">×</span>
            </button>
          ) : null}
          {keyword.trim() ? (
            <button className="chip" onClick={() => setKeyword('')}>
              关键词：{keyword.trim()} <span className="chip-x">×</span>
            </button>
          ) : null}
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="card">
          <div className="card-title">没有匹配的数据</div>
          <div className="card-subtitle">调整筛选条件，或点击重置恢复默认范围。</div>
          <div className="card-actions">
            <button className="btn" onClick={resetFilters}>
              重置筛选
            </button>
          </div>
        </div>
      ) : null}

      <div className="kpi-grid">
        <KpiCard title="问答条数" value={String(metrics.interactions)} />
        <KpiCard title="会话数" value={String(metrics.uniqueSessions)} />
        <KpiCard title="项目数" value={String(metrics.uniqueProjects)} />
        <KpiCard title="意图数" value={String(metrics.uniqueIntents)} />
        <KpiCard title="平均响应" value={formatSeconds(metrics.avgResponseSeconds)} />
        <KpiCard
          title="P50 / P90"
          value={`${formatSeconds(metrics.p50ResponseSeconds)} / ${formatSeconds(
            metrics.p90ResponseSeconds,
          )}`}
        />
        <KpiCard title="转人工" value={String(metrics.handoffCount)} />
        <KpiCard title="风险意图" value={String(metrics.riskCount)} sub="投诉/退款/退换等" />
      </div>

      <div className="grid-2">
        <ChartCard title="问答趋势（按小时）" option={trendOption} height={320} />
        <ChartCard title="Top 意图" option={intentsOption} height={320} />
      </div>

      <div className="grid-2">
        <ChartCard title="Top 项目" option={projectsOption} height={320} />
        <div className="card">
          <div className="card-title">最新问答（Top 50）</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>项目</th>
                  <th>意图</th>
                  <th>问题</th>
                  <th>回答</th>
                </tr>
              </thead>
              <tbody>
                {latestRows.map((r, idx) => (
                  <tr
                    key={`${r.sessionId}_${idx}`}
                    className="table-row"
                    onClick={() => setSelectedRow(r)}
                  >
                    <td className="td-muted">
                      {(r.questionTime ?? r.answerTime)?.toLocaleString() ?? '-'}
                    </td>
                    <td>{r.projectName || '-'}</td>
                    <td>{r.intent || '-'}</td>
                    <td className="td-wide">
                      <div className="clamp-2">{r.question || '-'}</div>
                    </td>
                    <td className="td-wide">
                      <div className="clamp-2">{r.answer || '-'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        open={selectedRow != null}
        title="问答详情"
        onClose={() => setSelectedRow(null)}
        footer={
          selectedRow ? (
            <div className="modal-footer-actions">
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  const t = `session_id: ${selectedRow.sessionId}\nproject: ${selectedRow.projectName}\nintent: ${selectedRow.intent}\nquestion_time: ${selectedRow.questionTime?.toISOString() ?? ''}\nanswer_time: ${selectedRow.answerTime?.toISOString() ?? ''}\n\nQ: ${selectedRow.question}\n\nA: ${selectedRow.answer}`
                  await navigator.clipboard.writeText(t)
                }}
              >
                复制
              </button>
              <button className="btn" onClick={() => setSelectedRow(null)}>
                关闭
              </button>
            </div>
          ) : null
        }
      >
        {selectedRow ? (
          <div className="detail">
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">Session</div>
                <div className="detail-value mono">{selectedRow.sessionId}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">项目</div>
                <div className="detail-value">{selectedRow.projectName || '-'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">意图</div>
                <div className="detail-value">{selectedRow.intent || '-'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">时间</div>
                <div className="detail-value">
                  {(selectedRow.questionTime ?? selectedRow.answerTime)?.toLocaleString() ?? '-'}
                </div>
              </div>
            </div>
            <div className="detail-section">
              <div className="detail-section-title">问题</div>
              <div className="detail-text">{selectedRow.question || '-'}</div>
            </div>
            <div className="detail-section">
              <div className="detail-section-title">回答</div>
              <div className="detail-text">{selectedRow.answer || '-'}</div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
