import { useCallback, useEffect, useState } from 'react'
import { getVoterId, supabase } from '../lib/supabase'
import type { MyVotes, NewPrice, Price, VoteValue } from '../types'

export function usePrices() {
  const [prices, setPrices] = useState<Price[]>([])
  const [myVotes, setMyVotes] = useState<MyVotes>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [p, v] = await Promise.all([
      supabase.from('prices_with_votes').select('*').order('updated_at', { ascending: false }).limit(500),
      supabase.rpc('my_votes', { p_voter: getVoterId() }),
    ])
    if (p.error) setError(p.error.message)
    else setPrices(p.data as Price[])
    if (v.data) {
      const rows = v.data as { price_id: string; value: number }[]
      setMyVotes(Object.fromEntries(rows.map((r) => [r.price_id, r.value as VoteValue])))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load().catch((e: Error) => {
      setError(e.message)
      setLoading(false)
    })
  }, [load])

  // Adds the town, or updates it if it already has a price
  const addPrice = async (input: NewPrice) => {
    const { error } = await supabase.rpc('submit_price', {
      p_province: input.province,
      p_town: input.town,
      p_live: input.live_price,
      p_meat: input.meat_price,
      p_source: input.source,
    })
    if (error) throw new Error(error.message)
    await load()
  }

  const vote = async (id: string, value: VoteValue) => {
    const prev = myVotes[id]
    const next = prev === value ? undefined : value // tap again to undo

    setMyVotes((m) => {
      const copy = { ...m }
      if (next) copy[id] = next
      else delete copy[id]
      return copy
    })
    setPrices((ps) =>
      ps.map((p) =>
        p.id !== id
          ? p
          : {
              ...p,
              up: p.up - (prev === 1 ? 1 : 0) + (next === 1 ? 1 : 0),
              down: p.down - (prev === -1 ? 1 : 0) + (next === -1 ? 1 : 0),
            }
      )
    )

    const { error } = await supabase.rpc('cast_vote', { p_price_id: id, p_voter: getVoterId(), p_value: next ?? 0 })
    if (error) {
      setError(error.message)
      load() // resync on failure
    }
  }

  return { prices, myVotes, loading, error, addPrice, vote }
}
