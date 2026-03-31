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
  showMovingAverage = true,
): unknown {
  const { tooltip, colors } = createBaseChartConfig(isDark)

  const chartData = data.length > 0 ? data : [{ x: '', y: 0 }]

  // 计算移动平均线（3点平均）
  const movingAvgData = data.length >= 3
    ? data.map((p, i, arr) => {
        if (i < 1 || i >= arr.length - 1) return null
        const sum = arr[i - 1].y + p.y + arr[i + 1].y
        return sum / 3
      })
    : []

  return {
    color: [color, '#ff9f43'],
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
    },
    legend: {
      show: showMovingAverage && data.length >= 3,
      data: ['实际', '移动平均'],
      textStyle: { color: colors.axisLabel },
      top: 0,
      right: 20,
    },
    dataZoom: data.length > 2 ? [
      { type: 'inside', xAxisIndex: 0 },
      { type: 'slider', xAxisIndex: 0, height: 18, bottom: 6 },
    ] : undefined,
    series: [
      {
        name: '实际',
        type: 'line',
        smooth: data.length > 1,
        data: chartData.map((p) => p.y),
        showSymbol: data.length > 0,
        lineStyle: { width: 2 },
        areaStyle: data.length > 0 ? { opacity: 0.18 } : undefined,
        emphasis: { focus: 'series' },
      },
      ...(showMovingAverage && movingAvgData.length > 0 ? [
        {
          name: '移动平均',
          type: 'line',
          smooth: true,
          data: movingAvgData,
          showSymbol: false,
          lineStyle: { width: 2, type: 'dashed' },
          emphasis: { focus: 'series' },
        },
      ] : []),
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

/**
 * 创建饼图配置（用于占比分布）
 */
export function createPieChartOption(
  data: { name: string; value: number }[],
  isDark: boolean,
): unknown {
  const colors = getThemeColors(isDark)

  const legendType = data.length > 10 ? 'scroll' : 'plain'

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      textStyle: { color: colors.tooltipText },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      textStyle: { color: colors.axisLabel },
      type: legendType,
      pageTextStyle: { color: colors.axisLabel },
    },
    color: ['#7c5cff', '#22c55e', '#60a5fa', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'],
    series: [
      {
        type: 'pie',
        radius: ['36%', '62%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: isDark ? '#1f2937' : '#ffffff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.axisLabel,
          },
        },
        labelLine: { show: false },
        data: data.map((d) => ({ name: d.name, value: d.value })),
      },
    ],
  }
}
