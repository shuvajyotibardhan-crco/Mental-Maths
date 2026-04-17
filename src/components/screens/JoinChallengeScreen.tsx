import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { joinChallenge } from '../../firebase/challenge'

interface JoinChallengeScreenProps {
  onNavigate: (screen: string) => void
  onChallengeJoined: (gameCode: string, destination?: string) => void
}

export function JoinChallengeScreen({ onNavigate, onChallengeJoined }: JoinChallengeScreenProps) {
  const { profile } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  async function handleJoin() {
    if (!profile || !code.trim() || joining) return
    setError('')
    setJoining(true)

    try {
      const joined = await joinChallenge(code.trim().toUpperCase(), profile)
      const dest = joined.status === 'playing' ? 'challenge-game' : 'challenge-lobby'
      onChallengeJoined(code.trim().toUpperCase(), dest)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join challenge.')
      setJoining(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-2xl font-bold text-primary-dark text-center">Join Challenge</h2>
      <p className="text-center text-gray-500 text-sm">Enter the 7-digit code from your friend</p>

      <input
        type="text"
        value={code}
        onChange={(e) => {
          const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
          setCode(val)
          setError('')
        }}
        placeholder="ABCDEFG"
        maxLength={7}
        className="w-full text-center text-3xl font-bold tracking-[0.3em] py-4 px-6 rounded-2xl bg-white/90 border-2 border-gray-200 focus:border-primary outline-none uppercase"
        autoFocus
      />

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}

      <button
        onClick={handleJoin}
        disabled={code.length < 7 || joining}
        className="w-full py-5 bg-primary text-white font-bold text-xl rounded-3xl shadow-lg hover:bg-primary-dark hover:shadow-xl active:scale-95 transition-all cursor-pointer disabled:opacity-40"
      >
        {joining ? 'Joining...' : 'Join'}
      </button>

      <button
        onClick={() => onNavigate('home')}
        className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 cursor-pointer"
      >
        ← Back
      </button>
    </div>
  )
}
