export function KpiCard(props: {
  title: string
  value: string
  sub?: string
}) {
  return (
    <div className="kpi">
      <div className="kpi-title">{props.title}</div>
      <div className="kpi-value">{props.value}</div>
      {props.sub ? <div className="kpi-sub">{props.sub}</div> : null}
    </div>
  )
}

