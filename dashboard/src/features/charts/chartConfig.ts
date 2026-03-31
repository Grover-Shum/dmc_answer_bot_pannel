/**
 * 图表主题配置
 */
type ThemeColors = {
  axisLabel: string
  axisLine: string
  splitLine: string
  tooltipBg: string
  tooltipText: string
  tooltipBorder: string
}

/**
 * 获取主题相关的颜色配置
 */
export function getThemeColors(isDark: boolean): ThemeColors {
  if (isDark) {
    return {
      axisLabel: 'rgba(255,255,255,0.72)',
      axisLine: 'rgba(255,255,255,0.14)',
      splitLine: 'rgba(255,255,255,0.08)',
      tooltipBg: 'rgba(17,24,39,0.94)',
      tooltipText: 'rgba(255,255,255,0.86)',
      tooltipBorder: 'rgba(255,255,255,0.14)',
    }
  }
  return {
    axisLabel: 'rgba(15,23,42,0.72)',
    axisLine: 'rgba(15,23,42,0.14)',
    splitLine: 'rgba(15,23,42,0.08)',
    tooltipBg: 'rgba(255,255,255,0.96)',
    tooltipText: 'rgba(15,23,42,0.9)',
    tooltipBorder: 'rgba(15,23,42,0.14)',
  }
}

/**
 * 创建通用的 tooltip 配置
 */
function createTooltipConfig(colors: ThemeColors): unknown {
  return {
    trigger: 'axis',
    backgroundColor: colors.tooltipBg,
    borderColor: colors.tooltipBorder,
    textStyle: { color: colors.tooltipText },
  }
}

/**
 * 创建通用图表配置
 */
export function createBaseChartConfig(
  isDark: boolean,
): {
  tooltip: Record<string, unknown>
  colors: ThemeColors
} {
  const colors = getThemeColors(isDark)
  return {
    tooltip: createTooltipConfig(colors) as Record<string, unknown>,
    colors,
  }
}

/**
 * 创建趋势图（折线图）配置
 */
export function createTrendChartOption(
  data: { x: string; y: number }[],
  isDark: boolean,
  color = '#7c5cff',
): unknown {
  const { tooltip, colors } = createBaseChartConfig(isDark)

  const chartData = data.length > 0 ? data : [{ x: '', y: 0 }]

  return {
    color: [color],
    tooltip,
    grid: { left: 42, right: 20, top: 26, bottom: data.length > 1 ? 34 : 20 },
    xAxis: {
      type: 'category',
      data: chartData.map((p) => p.x),
      axisLabel: { color: colors.axisLabel },
      axisLine: { lineStyle: { color: colors.axisLine } },
      axisTick: { show: data.length > 0 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: colors.axisLabel },
      splitLine: { lineStyle: { color: colors.splitLine } },
      minInterval: 1,
      min: 0,
    },
    dataZoom: data.length > 2 ? [
      { type: 'inside', xAxisIndex: 0 },
      { type: 'slider', xAxisIndex: 0, height: 18, bottom: 6 },
    ] : undefined,
    series: [
      {
        type: 'line',
        smooth: data.length > 1,
        data: chartData.map((p) => p.y),
        showSymbol: data.length > 0,
        lineStyle: { width: 2 },
        areaStyle: data.length > 0 ? { opacity: 0.18 } : undefined,
      },
    ],
  }
}

/**
 * 创建横向柱状图配置（用于 Top N 统计）
 */
export function createHorizontalBarChartOption(
  data: { name: string; value: number }[],
  isDark: boolean,
  color = '#22c55e',
  barMaxWidth = 14,
): unknown {
  const { tooltip, colors } = createBaseChartConfig(isDark)

  return {
    color: [color],
    tooltip: {
      ...tooltip,
      axisPointer: { type: 'shadow' },
    },
    grid: { left: 150, right: 18, top: 18, bottom: 18 },
    xAxis: {
      type: 'value',
      axisLabel: { color: colors.axisLabel },
      splitLine: { lineStyle: { color: colors.splitLine } },
    },
    yAxis: {
      type: 'category',
      data: data.map((d) => d.name),
      inverse: true,
      axisLabel: { color: colors.axisLabel },
      axisLine: { lineStyle: { color: colors.axisLine } },
    },
    series: [
      { type: 'bar', data: data.map((d) => d.value), barMaxWidth },
    ],
  }
}
