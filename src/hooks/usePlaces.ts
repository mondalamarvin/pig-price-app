import { useEffect, useState } from 'react'
import { loadPlaces, type Places } from '../lib/psgc'

export function usePlaces() {
  const [places, setPlaces] = useState<Places | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPlaces()
      .then(setPlaces)
      .catch((e: Error) => setError(e.message))
  }, [])

  return { places, placesError: error }
}
