import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useGame } from '../../context/GameContext'
import { getAvailableOperations, OPERATION_LABELS } from '../../constants/gradeConfig'
import type { OperationType, Difficulty, GameMode } from '../../types'

interface GameSetupScreenProps {
  onNavigate: (screen: string) => void
}

const DIFFICULTIES: { value: Difficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: 'bg-emerald-100 text-emerald-700 ring-emerald-400' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700 ring-amber-400' },
  { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-700 ring-red-400' },
]

const MODES: { value: GameMode; label: string; description: string }[] = [
  { value: 'timed', label: '⏱️ Timed', description: '2 minutes' },
  { value: 'fixed', label: '📝 20 Questions', description: 'No time limit' },
]

export function GameSetupScreen({ onNavigate }: GameSetupScreenProps) {
  const { profile } = useAuth()
  const { startGame } = useGame()

  const grade = profile?.grade ?? '3'
  const availableOps = getAvailableOperations(grade)

  const [operation, setOperation] = useState<OperationType>(availableOps[0]!)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [mode, setMode] = useState<GameMode>('fixed')

  function handleStart() {
    startGame({ grade, operation, difficulty, mode })
    onNavigate('game')
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-primary-dark text-center">Game Setup</h2>

      {/* Operation Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Operation</label>
        <div className="grid grid-cols-2 gap-2">
          {/* Mix option first */}
          <button
            onClick={() => setOperation('mix')}
            className={`py-3 px-3 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
              operation === 'mix'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            {OPERATION_LABELS.mix}
          </button>
          {availableOps.map((op) => (
            <button
              key={op}
              onClick={() => setOperation(op)}
              className={`py-3 px-3 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
                operation === op
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white/80 text-gray-700 hover:bg-white'
              }`}
            >
              {OPERATION_LABELS[op]}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={`py-3 rounded-2xl font-semibold transition-all cursor-pointer ${
                difficulty === d.value
                  ? `${d.color} ring-2 shadow-md`
                  : 'bg-white/80 text-gray-600 hover:bg-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Mode</label>
        <div className="grid grid-cols-2 gap-3">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`py-4 rounded-2xl text-center transition-all cursor-pointer ${
                mode === m.value
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white/80 text-gray-700 hover:bg-white'
              }`}
            >
              <div className="font-semibold text-lg">{m.label}</div>
              <div className={`text-xs mt-1 ${mode === m.value ? 'text-blue-100' : 'text-gray-400'}`}>
                {m.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="w-full py-5 bg-success text-white font-bold text-xl rounded-3xl shadow-lg hover:bg-emerald-600 hover:shadow-xl active:scale-95 transition-all cursor-pointer"
      >
        Start!
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
