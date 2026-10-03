import { useEffect, useState } from 'react'
import type { Price, VoteValue } from '../types'
import { cn, peso, timeAgo } from '../lib/utils'
import { supabase } from '../lib/supabase'

function trust(p: Price) {
  const net = p.up - p.down
  if (net >= 10) return { label: 'Confirmed by neighbors', cls: 'border-success/30 bg-success/10 text-success' }
  if (net <= 0) return { label: 'Disputed', cls: 'border-primary/30 bg-accent text-accent-foreground' }
  return { label: 'Needs more votes', cls: 'border-border bg-secondary text-secondary-foreground' }
}

function VoteButton({ dir, active, onClick }: { dir: 'up' | 'down'; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={dir === 'up' ? 'Mark as accurate' : 'Mark as inaccurate'}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-md border border-input transition-colors hover:bg-accent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'border-primary bg-primary text-primary-foreground hover:bg-primary' : 'bg-background'
      )}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === 'up' ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
      </svg>
    </button>
  )
}

/** Green ▲ when the price went up, red ▼ when it went down, nothing if unchanged or first report. */
function Change({ delta }: { delta: number | null }) {
  const n = Number(delta ?? 0)
  if (!n) return null
  const up = n > 0
  return (
    <span
      className={cn('ml-1.5 inline-flex items-center gap-0.5 text-xs font-medium', up ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}
      title={up ? `Up ${peso(n)} from the previous price` : `Down ${peso(-n)} from the previous price`}
    >
      <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d={up ? 'M12 4 22 20H2z' : 'M12 20 2 4h20z'} />
      </svg>
      {peso(Math.abs(n))}
      <span className="sr-only">{up ? 'increase' : 'decrease'}</span>
    </span>
  )
}

function Money({ label, value, delta }: { label: string; value: number; delta: number | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex items-baseline text-xl font-semibold tabular-nums">
        {peso(value)}<span className="text-xs font-normal text-muted-foreground">/kg</span>
        <Change delta={delta} />
      </dd>
    </div>
  )
}

type HistoryRow = { id: string; live_price: number; meat_price: number; created_at: string }

function History({ priceId }: { priceId: string }) {
  const [rows, setRows] = useState<HistoryRow[] | null>(null)
  useEffect(() => {
    supabase
      .from('price_history')
      .select('id, live_price, meat_price, created_at')
      .eq('price_id', priceId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setRows((data as HistoryRow[]) ?? []))
  }, [priceId])

  if (!rows) return <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
  return (
    <table className="mt-3 w-full max-w-sm text-xs tabular-nums">
      <thead>
        <tr className="text-left text-muted-foreground">
          <th className="py-1 font-normal">When</th>
          <th className="py-1 font-normal">Live</th>
          <th className="py-1 font-normal">Meat</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t border-border">
            <td className="py-1">{timeAgo(r.created_at)}</td>
            <td className="py-1">{peso(r.live_price)}</td>
            <td className="py-1">{peso(r.meat_price)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

type Props = { price: Price; myVote?: VoteValue; onVote: (id: string, v: VoteValue) => void }

export function PriceCard({ price, myVote, onVote }: Props) {
  const t = trust(price)
  const [showHistory, setShowHistory] = useState(false)
  return (
    <li className="flex gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-1.5 pt-0.5">
        <div className="flex items-center gap-2">
          <VoteButton dir="up" active={myVote === 1} onClick={() => onVote(price.id, 1)} />
          <span className="min-w-4 text-sm font-semibold tabular-nums" title="Say it is accurate">{price.up}</span>
        </div>
        <div className="flex items-center gap-2">
          <VoteButton dir="down" active={myVote === -1} onClick={() => onVote(price.id, -1)} />
          <span className="min-w-4 text-sm font-semibold tabular-nums" title="Say it is inaccurate">{price.down}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="font-semibold">{price.town}, {price.province}</h3>
          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', t.cls)}>{t.label}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{price.source}, updated {timeAgo(price.updated_at)}</p>
        <dl className="mt-3 grid max-w-sm grid-cols-2 gap-4">
          <Money label="Live weight" value={price.live_price} delta={price.live_change} />
          <Money label="Meat" value={price.meat_price} delta={price.meat_change} />
        </dl>
        <button
          onClick={() => setShowHistory((s) => !s)}
          aria-expanded={showHistory}
          className="mt-3 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          {showHistory ? 'Hide history' : 'Price history'}
        </button>
        {showHistory && <History priceId={price.id} />}
      </div>
    </li>
  )
}
