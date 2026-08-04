interface Stat {
  label: string
  value: number
  suffix?: string
  tone?: 'default' | 'warn'
}

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <ul className="stat-grid">
      {stats.map((stat) => (
        <li
          key={stat.label}
          className={`stat${stat.tone === 'warn' && stat.value > 0 ? ' stat--warn' : ''}`}
        >
          <span className="stat__value">
            {stat.value}
            {stat.suffix ?? ''}
          </span>
          <span className="stat__label">{stat.label}</span>
        </li>
      ))}
    </ul>
  )
}
