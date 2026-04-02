export function KpiCard(props: {
  title: string
  value: string
  sub?: string
  variant?: 'danger' | 'success' | 'warning' | 'default'
}) {
  const vClass = props.variant && props.variant !== 'default' ? `kpi-value kpi-value-${props.variant}` : 'kpi-value'
  return (
    <div className="kpi">
      <div className="kpi-title">{props.title}</div>
      <div className={vClass}>{props.value}</div>
      {props.sub ? <div className="kpi-sub">{props.sub}</div> : null}
    </div>
  )
}

