import ReactECharts from 'echarts-for-react'

export function ChartCard(props: { title: string; option: unknown; height?: number }) {
  return (
    <div className="card">
      <div className="card-title">{props.title}</div>
      <div className="chart">
        <ReactECharts
          option={props.option}
          notMerge={true}
          lazyUpdate={true}
          style={{ height: props.height ?? 320, width: '100%' }}
        />
      </div>
    </div>
  )
}
