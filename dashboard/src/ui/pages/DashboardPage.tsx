import { useEffect, useMemo, useState, useDeferredValue } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { bucketTrendByView, computeMetrics, groupCount } from '../../features/metrics/metrics'
import type { TrendViewType } from '../../features/metrics/metrics'
import { fetchOnlineRows } from '../../features/api/fetchOnline'
import { createHorizontalBarChartOption, createTrendChartOption, createPieChartOption } from '../../features/charts/chartConfig'
import { useDataStore } from '../../store/useDataStore'
import { useUiStore } from '../../store/useUiStore'
import {
  THEME_CONSTANTS,
  ERROR_MESSAGES,
  UI_CONSTANTS,
  CSV_CONSTANTS,
} from '../../constants'
import type { NormalizedRow } from '../../types'
import { ChartCard } from '../components/ChartCard'
import { KpiCard } from '../components/KpiCard'
import { Modal } from '../components/Modal'

type ChartClickParams = {
  componentType?: string
  seriesType?: string
  dataIndex?: number
}

function formatPercent(v: number): string {
  if (!Number.isFinite(v)) return UI_CONSTANTS.DISPLAY.EMPTY
  return `${(v * 100).toFixed(1)}%`
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

function setTimeRangeRange(value: 'custom' | 'last3' | 'last7' | 'last15' | 'last30') {
  const now = new Date()

  let start: Date
  let end: Date

  switch (value) {
    case 'last3':
      start = new Date(now)
      start.setDate(start.getDate() - 2)
      start.setHours(0, 0, 0, 0)
      end = new Date(now)
      break
    case 'last7':
      start = new Date(now)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      end = new Date(now)
      break
    case 'last15':
      start = new Date(now)
      start.setDate(start.getDate() - 14)
      start.setHours(0, 0, 0, 0)
      end = new Date(now)
      break
    case 'last30':
      start = new Date(now)
      start.setDate(start.getDate() - 29)
      start.setHours(0, 0, 0, 0)
      end = new Date(now)
      break
    default:
      return
  }

  return { fromTime: toDatetimeLocalValue(start), toTime: toDatetimeLocalValue(end) }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { rows } = useDataStore()
  const setData = useDataStore((s) => s.setData)
  const theme = useUiStore((s) => s.theme)
  const [loadingOnline, setLoadingOnline] = useState(false)
  const [onlineError, setOnlineError] = useState<string | null>(null)

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

  const defaultPreset = useMemo(() => setTimeRangeRange('last7'), [])

  const [project, setProject] = useState<string>(UI_CONSTANTS.DISPLAY.ALL)
  const [intent, setIntent] = useState<string>(UI_CONSTANTS.DISPLAY.ALL)
  const [keyword, setKeyword] = useState<string>('')
  const keywordDeferred = useDeferredValue(keyword)
  const [fromTime, setFromTime] = useState<string>(() => defaultPreset?.fromTime ?? '')
  const [toTime, setToTime] = useState<string>(() => defaultPreset?.toTime ?? '')
  const [selectedRow, setSelectedRow] = useState<NormalizedRow | null>(null)
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null)
  const [trendView, setTrendView] = useState<TrendViewType>('hour')
  const [timeRange, setTimeRange] = useState<'custom' | 'last3' | 'last7' | 'last15' | 'last30'>('last7')
  const [chartSelection, setChartSelection] = useState<{ type: 'trend' | 'intent' | 'project' | null; value: string | null }>({ type: null, value: null })

  function getTrendBucketKey(d: Date, view: TrendViewType): string {
    const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)
    const getWeekNumber = (date: Date): number => {
      const dd = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      const dayNum = dd.getUTCDay() || 7
      dd.setUTCDate(dd.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(dd.getUTCFullYear(), 0, 1))
      return Math.ceil(((dd.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    }

    switch (view) {
      case 'hour':
        return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:00`
      case 'day':
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
      case 'week': {
        const weekStart = new Date(d)
        const day = weekStart.getDay()
        const diff = day === 0 ? 6 : day - 1
        weekStart.setDate(weekStart.getDate() - diff)
        weekStart.setHours(0, 0, 0, 0)
        return `${weekStart.getFullYear()}-W${getWeekNumber(weekStart)}`
      }
      case 'month':
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
      default:
        return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:00`
    }
  }

  const baseRows = useMemo(() => {
    const kw = keywordDeferred.trim()
    const from = fromDatetimeLocalValue(fromTime || defaultFromTime)
    const to = fromDatetimeLocalValue(toTime || defaultToTime)
    return rows.filter((r) => {
      if (project !== UI_CONSTANTS.DISPLAY.ALL && r.projectName !== project) return false
      if (intent !== UI_CONSTANTS.DISPLAY.ALL && r.intent !== intent) return false
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

  const trend = useMemo(() => bucketTrendByView(baseRows, trendView), [trendView, baseRows])

  const filteredRows = useMemo(() => {
    if (!chartSelection.type || !chartSelection.value) return baseRows
    return baseRows.filter((r) => {
      if (chartSelection.type === 'intent') return r.intent === chartSelection.value
      if (chartSelection.type === 'project') return r.projectName === chartSelection.value
      if (chartSelection.type === 'trend') {
        const t = r.questionTime ?? r.answerTime
        if (!t) return false
        return getTrendBucketKey(t, trendView) === chartSelection.value
      }
      return true
    })
  }, [baseRows, chartSelection.type, chartSelection.value, trendView])

  const metrics = useMemo(() => computeMetrics(filteredRows), [filteredRows])
  const intentsTop = useMemo(
    () =>
      groupCount(
        filteredRows,
        (r) => r.intent || UI_CONSTANTS.DISPLAY.UNLABELED,
        UI_CONSTANTS.CHART.DEFAULT_TOP_N,
      ),
    [filteredRows],
  )
  const projectsTop = useMemo(
    () =>
      groupCount(
        filteredRows,
        (r) => r.projectName || UI_CONSTANTS.DISPLAY.UNLABELED,
        UI_CONSTANTS.CHART.DEFAULT_TOP_N,
      ),
    [filteredRows],
  )

  const latestRows = useMemo(() => {
    return filteredRows
      .slice()
      .sort(sortByTimeDesc)
      .slice(0, UI_CONSTANTS.TABLE.LATEST_ROWS_LIMIT)
  }, [filteredRows])

  useEffect(() => {
    if (rows.length > 0) return
    let cancelled = false
    setLoadingOnline(true)
    setOnlineError(null)
    void (async () => {
      try {
        const data = await fetchOnlineRows()
        if (!cancelled) setData(data)
      } catch (e) {
        if (!cancelled) {
          setOnlineError(e instanceof Error ? e.message : ERROR_MESSAGES.FETCH_ONLINE_FAILED)
        }
      } finally {
        if (!cancelled) setLoadingOnline(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [rows.length, setData])

  const isDarkTheme = theme === THEME_CONSTANTS.DARK

  const trendOption = useMemo(() => {
    return createTrendChartOption(trend, isDarkTheme, '#7c5cff', true) as EChartsOption
  }, [trend, isDarkTheme])

  const intentsOption = useMemo(() => {
    return createHorizontalBarChartOption(intentsTop, isDarkTheme, '#22c55e') as EChartsOption
  }, [intentsTop, isDarkTheme])

  const projectsOption = useMemo(() => {
    return createHorizontalBarChartOption(projectsTop, isDarkTheme, '#60a5fa') as EChartsOption
  }, [projectsTop, isDarkTheme])

  const intentsPieOption = useMemo(() => {
    return createPieChartOption(intentsTop, isDarkTheme) as EChartsOption
  }, [intentsTop, isDarkTheme])

  const projectsPieOption = useMemo(() => {
    return createPieChartOption(projectsTop, isDarkTheme) as EChartsOption
  }, [projectsTop, isDarkTheme])

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
    setProject(UI_CONSTANTS.DISPLAY.ALL)
    setIntent(UI_CONSTANTS.DISPLAY.ALL)
    setKeyword('')
    const preset = setTimeRangeRange('last7')
    setFromTime(preset?.fromTime ?? '')
    setToTime(preset?.toTime ?? '')
    setTimeRange('last7')
    setChartSelection({ type: null, value: null })
  }

  function handleTimeRangeChange(range: 'custom' | 'last3' | 'last7' | 'last15' | 'last30') {
    setTimeRange(range)
    if (range !== 'custom') {
      const timeValues = setTimeRangeRange(range)
      if (timeValues) {
        setFromTime(timeValues.fromTime)
        setToTime(timeValues.toTime)
      }
    }
  }

  function handleTrendChartClick(params: unknown) {
    const p = params as ChartClickParams
    if (p.componentType === 'series' && p.seriesType === 'line' && typeof p.dataIndex === 'number') {
      const timeLabel = trend[p.dataIndex]?.x
      if (timeLabel) {
        setChartSelection({ type: 'trend', value: timeLabel })
      } else {
        setChartSelection({ type: null, value: null })
      }
    }
  }

  function handleBarChartClick(params: unknown, type: 'intent' | 'project') {
    const p = params as ChartClickParams
    if (p.componentType === 'series' && typeof p.dataIndex === 'number') {
      const data = type === 'intent' ? intentsTop : projectsTop
      const label = data[p.dataIndex]?.name
      if (label) {
        setChartSelection({ type, value: label })
      } else {
        setChartSelection({ type: null, value: null })
      }
    }
  }

  function handlePieChartClick(params: unknown, type: 'intent' | 'project') {
    const p = params as ChartClickParams
    if (p.componentType === 'series' && typeof p.dataIndex === 'number') {
      const data = type === 'intent' ? intentsTop : projectsTop
      const label = data[p.dataIndex]?.name
      if (label) {
        setChartSelection({ type, value: label })
      } else {
        setChartSelection({ type: null, value: null })
      }
    }
  }

  function exportCsv() {
    const header = CSV_CONSTANTS.HEADERS
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

  async function copyRowContent(row: NormalizedRow, mode: 'question' | 'answer' | 'all') {
    const text =
      mode === 'question'
        ? row.question || ''
        : mode === 'answer'
          ? row.answer || ''
          : `session_id: ${row.sessionId}
project: ${row.projectName || '-'}
intent: ${row.intent || '-'}
time: ${(row.questionTime ?? row.answerTime)?.toLocaleString() ?? '-'}

Q: ${row.question || '-'}

A: ${row.answer || '-'}`

    if (!text) return
    await navigator.clipboard.writeText(text)
  }

  if (rows.length === 0) {
    return (
      <div className="page">
        <div className="card">
          <div className="card-title">
            {loadingOnline ? '正在拉取线上数据…' : '还没有数据'}
          </div>
          <div className="card-subtitle">
            {loadingOnline
              ? '首次进入看板会自动拉取最新数据。'
              : onlineError
                ? `线上拉取失败：${onlineError}`
                : '先导入 Excel 数据，或检查线上数据服务配置。'}
          </div>
          <div className="card-actions">
            <button
              className="btn"
              onClick={() => {
                navigate('/')
              }}
              disabled={loadingOnline}
            >
              去上传
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setLoadingOnline(true)
                setOnlineError(null)
                void (async () => {
                  try {
                    const data = await fetchOnlineRows()
                    setData(data)
                  } catch (e) {
                    setOnlineError(e instanceof Error ? e.message : '线上数据拉取失败')
                  } finally {
                    setLoadingOnline(false)
                  }
                })()
              }}
              disabled={loadingOnline}
            >
              重试拉取
            </button>
          </div>
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
            <div className="label">时间范围</div>
            <select
              value={timeRange}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'custom' || v === 'last3' || v === 'last7' || v === 'last15' || v === 'last30') {
                  handleTimeRangeChange(v)
                }
              }}
            >
              <option value="custom">自定义</option>
              <option value="last3">最近 3 天</option>
              <option value="last7">最近 7 天</option>
              <option value="last15">最近 15 天</option>
              <option value="last30">最近 1 个月</option>
            </select>
          </div>
          <div className="field">
            <div className="label">项目</div>
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
            >
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
          {chartSelection.value && chartSelection.type === 'trend' ? (
            <button className="chip" onClick={() => setChartSelection({ type: null, value: null })}>
              时间：{chartSelection.value} <span className="chip-x">×</span>
            </button>
          ) : null}
          {chartSelection.value && chartSelection.type === 'intent' ? (
            <button className="chip" onClick={() => setChartSelection({ type: null, value: null })}>
              意图：{chartSelection.value} <span className="chip-x">×</span>
            </button>
          ) : null}
          {chartSelection.value && chartSelection.type === 'project' ? (
            <button className="chip" onClick={() => setChartSelection({ type: null, value: null })}>
              项目：{chartSelection.value} <span className="chip-x">×</span>
            </button>
          ) : null}
        </div>
        <div className="help">
          提示：可点击图表联动筛选；点击上方标签可取消对应条件。
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
        <KpiCard title="问题数（去重）" value={String(metrics.uniqueQuestions)} />
        <KpiCard
          title="转人工率"
          value={formatPercent(metrics.handoffRate)}
          sub={`${metrics.handoffCount} 次`}
          variant={metrics.handoffRate > 0.15 ? 'danger' : metrics.handoffRate > 0.05 ? 'warning' : 'default'}
        />
        <KpiCard
          title="风险意图占比"
          value={formatPercent(metrics.riskRate)}
          sub={`${metrics.riskCount} 条`}
          variant={metrics.riskRate > 0.10 ? 'danger' : metrics.riskRate > 0.02 ? 'warning' : 'default'}
        />
        <KpiCard
          title="意图覆盖率"
          value={formatPercent(1 - metrics.unlabeledIntentRate)}
          sub={`未标注 ${metrics.unlabeledIntentCount} 条`}
        />
        <KpiCard
          title="Top 意图占比"
          value={formatPercent(metrics.topIntentShare)}
          sub={intentsTop[0]?.name ?? UI_CONSTANTS.DISPLAY.EMPTY}
        />
        <KpiCard
          title="重复咨询率"
          value={formatPercent(metrics.duplicateQuestionRate)}
          sub={`≈${Math.max(0, metrics.interactions - metrics.uniqueQuestions)} 条重复`}
        />
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">问答趋势</div>
          <div className="card-actions">
            {(['hour', 'day', 'week', 'month'] as const).map((view) => (
              <button
                key={view}
                className={`btn btn-secondary ${trendView === view ? 'active' : ''}`}
                onClick={() => setTrendView(view)}
              >
                {view === 'hour' ? '按小时' : view === 'day' ? '按天' : view === 'week' ? '按周' : '按月'}
              </button>
            ))}
          </div>
        </div>
        <div className="chart">
          <ReactECharts
            option={trendOption}
            notMerge={true}
            lazyUpdate={true}
            style={{ height: 400, width: '100%' }}
            onEvents={{
              click: handleTrendChartClick,
            }}
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Top 意图</div>
          <div className="chart">
            <ReactECharts
              option={intentsOption}
              notMerge={true}
              lazyUpdate={true}
              style={{ height: 320, width: '100%' }}
              onEvents={{
                click: (params: unknown) => handleBarChartClick(params, 'intent'),
              }}
            />
          </div>
        </div>
        <div className="card">
          <div className="card-title">Top 项目</div>
          <div className="chart">
            <ReactECharts
              option={projectsOption}
              notMerge={true}
              lazyUpdate={true}
              style={{ height: 320, width: '100%' }}
              onEvents={{
                click: (params: unknown) => handleBarChartClick(params, 'project'),
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">意图分布</div>
          <div className="chart">
            <ReactECharts
              option={intentsPieOption}
              notMerge={true}
              lazyUpdate={true}
              style={{ height: 400, width: '100%' }}
              onEvents={{
                click: (params: unknown) => handlePieChartClick(params, 'intent'),
              }}
            />
          </div>
        </div>
        <div className="card">
          <div className="card-title">项目分布</div>
          <div className="chart">
            <ReactECharts
              option={projectsPieOption}
              notMerge={true}
              lazyUpdate={true}
              style={{ height: 400, width: '100%' }}
              onEvents={{
                click: (params: unknown) => handlePieChartClick(params, 'project'),
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid-2">
        <ChartCard title="Top 项目" option={projectsOption} height={320} />
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">最近问答</div>
              <div className="card-subtitle">按时间倒序展示最近 50 条，可直接展开、复制或查看详情。</div>
            </div>
          </div>
          <div className="qa-feed">
            {latestRows.length > 0 ? (
              latestRows.map((r, idx) => {
                const rowKey = `${r.sessionId}_${idx}`
                const expanded = expandedRowKey === rowKey
                return (
                  <div key={rowKey} className={`qa-item ${expanded ? 'qa-item-expanded' : ''}`}>
                    <div className="qa-item-head">
                      <div className="qa-meta">
                        <span className="td-muted">
                          {(r.questionTime ?? r.answerTime)?.toLocaleString() ?? '-'}
                        </span>
                        {r.projectName ? <span className="tag tag-project">{r.projectName}</span> : null}
                        {r.intent ? <span className="tag tag-intent">{r.intent}</span> : null}
                      </div>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setExpandedRowKey(expanded ? null : rowKey)
                        }}
                      >
                        {expanded ? '收起' : '展开'}
                      </button>
                    </div>

                    <div className="qa-block">
                      <div className="qa-label">问题</div>
                      <div className={expanded ? 'qa-text' : 'qa-text clamp-2'}>{r.question || '-'}</div>
                    </div>

                    <div className="qa-block">
                      <div className="qa-label">回答</div>
                      <div className={expanded ? 'qa-text' : 'qa-text clamp-3'}>{r.answer || '-'}</div>
                    </div>

                    <div className="qa-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          void copyRowContent(r, 'question')
                        }}
                      >
                        复制问题
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          void copyRowContent(r, 'answer')
                        }}
                      >
                        复制回答
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          void copyRowContent(r, 'all')
                        }}
                      >
                        复制整条
                      </button>
                      <button
                        className="btn"
                        onClick={() => {
                          setSelectedRow(r)
                        }}
                      >
                        查看详情
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <div>暂无问答数据</div>
              </div>
            )}
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
