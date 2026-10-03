export type Price = {
  id: string
  province: string
  town: string
  live_price: number
  meat_price: number
  source: string
  created_at: string
  updated_at: string
  up: number
  down: number
  live_change: number | null // change since the previous price (null = first report)
  meat_change: number | null
}

export type NewPrice = {
  province: string
  town: string
  live_price: number
  meat_price: number
  source: string
}
export type VoteValue = 1 | -1
export type MyVotes = Record<string, VoteValue>

export const SOURCES = ['Public market', 'Farm gate', 'Trader', 'Slaughterhouse'] as const
