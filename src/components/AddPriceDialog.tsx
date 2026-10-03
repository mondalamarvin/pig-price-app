import { FormEvent, useEffect, useRef, useState } from 'react'
import { SOURCES, type NewPrice } from '../types'
import type { Places } from '../lib/psgc'
import { Button } from './ui/button'
import { Field, Input, Select } from './ui/field'

type Props = {
  open: boolean
  places: Places | null
  defaultProvince?: string
  onClose: () => void
  onSubmit: (p: NewPrice) => Promise<void>
}

export function AddPriceDialog({ open, places, defaultProvince = '', onClose, onSubmit }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [province, setProvince] = useState('')
  const [town, setTown] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const towns = places?.townsByProvince[province] ?? []

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      setProvince(defaultProvince)
      setTown('')
      d.showModal()
    }
    if (!open && d.open) d.close()
  }, [open, defaultProvince])

  async function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    setSaving(true)
    setError('')
    try {
      await onSubmit({
        province,
        town,
        live_price: Number(f.get('live')),
        meat_price: Number(f.get('meat')),
        source: String(f.get('source')),
      })
      form.reset()
      setProvince('')
      setTown('')
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-card p-0 text-foreground shadow-lg"
    >
      <form onSubmit={handle} className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Add a price</h2>
          <p className="text-sm text-muted-foreground">Share what you saw or paid. If this town already has a price, it gets updated and the change is tracked.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Province">
            <Select
              required
              value={province}
              disabled={!places}
              onChange={(e) => { setProvince(e.target.value); setTown('') }}
            >
              <option value="">{places ? 'Select province' : 'Loading…'}</option>
              {places?.provinces.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Town / city">
            <Select required value={town} disabled={!province} onChange={(e) => setTown(e.target.value)}>
              <option value="">{province ? 'Select town' : 'Pick a province'}</option>
              {towns.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Live weight (₱/kg)">
            <Input name="live" type="number" min="1" max="1000" step="0.5" required placeholder="0.00" className="tabular-nums" />
          </Field>
          <Field label="Meat (₱/kg)">
            <Input name="meat" type="number" min="1" max="2000" step="0.5" required placeholder="0.00" className="tabular-nums" />
          </Field>
        </div>
        <Field label="Where did you see it?">
          <Select name="source">{SOURCES.map((s) => <option key={s}>{s}</option>)}</Select>
        </Field>
        {error && <p className="text-sm text-primary" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Posting…' : 'Post price'}</Button>
        </div>
      </form>
    </dialog>
  )
}
