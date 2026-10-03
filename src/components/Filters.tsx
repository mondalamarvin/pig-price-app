import { Button } from './ui/button'
import { Field, Select } from './ui/field'

export type SortKey = 'recent' | 'votes' | 'liveHigh' | 'liveLow'
export type FilterState = { province: string; town: string; sort: SortKey }

type Props = {
  value: FilterState
  provinces: string[]
  towns: string[]
  onChange: (next: FilterState) => void
}

export function Filters({ value, provinces, towns, onChange }: Props) {
  return (
    <section className="rounded-lg border border-border bg-card p-3 sm:p-4" aria-label="Filters">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Province" className="col-span-2 sm:col-span-1">
          <Select value={value.province} onChange={(e) => onChange({ ...value, province: e.target.value, town: '' })}>
            <option value="">All provinces</option>
            {provinces.map((p) => <option key={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Town / city" className="col-span-2 sm:col-span-1">
          <Select
            value={value.town}
            disabled={!value.province}
            onChange={(e) => onChange({ ...value, town: e.target.value })}
          >
            <option value="">{value.province ? 'All towns' : 'Pick a province first'}</option>
            {towns.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Sort by">
          <Select value={value.sort} onChange={(e) => onChange({ ...value, sort: e.target.value as SortKey })}>
            <option value="recent">Newest</option>
            <option value="votes">Most trusted</option>
            <option value="liveHigh">Live price, high to low</option>
            <option value="liveLow">Live price, low to high</option>
          </Select>
        </Field>
        <div className="flex items-end">
          <Button variant="outline" className="h-10 w-full" onClick={() => onChange({ province: '', town: '', sort: 'recent' })}>
            Clear filters
          </Button>
        </div>
      </div>
    </section>
  )
}
