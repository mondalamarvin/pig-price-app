import type { Price } from '../types'
import { peso } from '../lib/utils'

function Stat({ label, rows, k }: { label: string; rows: Price[]; k: 'live_price' | 'meat_price' }) {
  const vals = rows.map((r) => r[k])
  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums">{avg ? peso(avg) : '–'}</p>
      {vals.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
          Range {peso(Math.min(...vals))} to {peso(Math.max(...vals))}
        </p>
      )}
    </div>
  )
}

export function Summary({ rows, areaName }: { rows: Price[]; areaName: string }) {
  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">What pigs are selling for in {areaName}</h1>
      {rows.length > 0 && (
        <p className="mt-1 text-sm text-muted-foreground">
          Based on {rows.length} report{rows.length > 1 ? 's' : ''}
        </p>
      )}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Stat label="Live weight, average per kg" rows={rows} k="live_price" />
        <Stat label="Meat (dressed), average per kg" rows={rows} k="meat_price" />
      </div>
    </section>
  )
}
