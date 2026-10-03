import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')

export const supabase = createClient(url, key)

/** No login: each browser gets a random id so it can vote once per price. */
let fallbackId: string | undefined
export function getVoterId(): string {
  try {
    let id = localStorage.getItem('voter_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('voter_id', id)
    }
    return id
  } catch {
    return (fallbackId ??= crypto.randomUUID()) // storage blocked: lasts until reload
  }
}
