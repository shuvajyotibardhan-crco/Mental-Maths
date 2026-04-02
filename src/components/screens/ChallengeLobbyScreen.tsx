import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useChallengeListener } from '../../hooks/useChallengeListener'
import { startChallenge, markPlayerReady } from '../../firebase/challenge'

interface ChallengeLobbyScreenProps {
  gameCode: string
  onNavigate: (screen: string) => void
}

export function ChallengeLobbyScreen({ gameCode, onNavigate }: ChallengeLobbyScreenProps) {
  const { profile } = useAuth()
  const { challenge, loading } = useChallengeListener(gameCode)

  const isHost = challenge?.hostId === profile?.uid
  const players = challenge ? Object.entries(challenge.players) : []
  const allReady = players.length > 0 && players.every(([, p]) => p.ready)

  // Auto-set ready once we have the challenge data
  useEffect(() => {
    if (!challenge || !profile) return
    const me = challenge.players[profile.uid]
    if (me && !me.ready) {
      markPlayerReady(gameCode, profile.uid).catch(console.error)
    }
  }, [challenge, profile, gameCode])

  // Navigate to game when status changes to 'playing'
  useEffect(() => {
    if (challenge?.status === 'playing') {
      onNavigate('challenge-game')
    }
  }, [challenge?.status, onNavigate])

  async function handleStart() {
    if (!isHost || !allReady) return
    try {
      await startChallenge(gameCode)
    } catch (err) {
      console.error('Failed to start challenge:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-500 animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-red-500">Challenge not found.</p>
        <button onClick={() => onNavigate('home')} className="text-primary font-medium cursor-pointer">
          Go Home
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-primary-dark">Challenge Lobby</h2>
        <p className="text-gray-500 text-sm">Share this code with friends:</p>
        <div className="bg-white/90 rounded-2xl py-4 px-6 inline-block shadow-md">
          <span className="text-4xl font-bold tracking-[0.3em] text-primary-dark">{gameCode}</span>
        </div>
      </div>

      {/* Game Config Summary */}
      <div className="bg-white/60 rounded-2xl p-4 text-center text-sm text-gray-600">
        <span className="font-semibold">Grade {challenge.config.grade}</span>
        {' · '}
        <span className="capitalize">{challenge.config.operation}</span>
        {' · '}
        <span className="capitalize">{challenge.config.difficulty}</span>
        {' · '}
        <span>{challenge.config.mode === 'timed' ? '2 min' : '20 Qs'}</span>
      </div>

      {/* Players */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Players ({players.length})
        </h3>
        <div className="space-y-2">
          {players.map(([uid, player]) => (
            <div
              key={uid}
              className="flex items-center gap-3 bg-white/80 rounded-2xl p-4"
            >
              <span className="text-3xl">{player.avatar}</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">
                  {player.name}
                  {uid === challenge.hostId && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Host</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">@{player.username}</p>
              </div>
              <span className={`text-sm font-medium ${player.ready ? 'text-emerald-500' : 'text-gray-400'}`}>
                {player.ready ? 'Ready' : 'Joining...'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Waiting / Start */}
      {isHost ? (
        <div className="space-y-3">
          <button
            onClick={handleStart}
            disabled={players.length < 2 || !allReady}
            className="w-full py-5 bg-success text-white font-bold text-xl rounded-3xl shadow-lg hover:bg-emerald-600 hover:shadow-xl active:scale-95 transition-all cursor-pointer disabled:opacity-40"
          >
            {players.length < 2 ? 'Waiting for players...' : !allReady ? 'Waiting for everyone...' : 'Start Game!'}
          </button>
          <p className="text-center text-xs text-gray-400">
            Need at least 2 players to start
          </p>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-2xl animate-pulse mb-2">Waiting for host to start...</div>
          <p className="text-sm text-gray-500">
            {allReady ? 'Everyone is ready!' : 'Waiting for all players...'}
          </p>
        </div>
      )}

      <button
        onClick={() => onNavigate('home')}
        className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 cursor-pointer"
      >
        ← Leave
      </button>
    </div>
  )
}
