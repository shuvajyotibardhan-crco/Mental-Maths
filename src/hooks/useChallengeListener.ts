import { useState, useEffect } from 'react'
import { subscribeToChallenge } from '../firebase/challenge'
import type { Challenge } from '../types/challenge'

export function useChallengeListener(gameCode: string | null) {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gameCode) {
      setChallenge(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToChallenge(gameCode, (data) => {
      setChallenge(data)
      setLoading(false)
    })

    return unsubscribe
  }, [gameCode])

  return { challenge, loading }
}
