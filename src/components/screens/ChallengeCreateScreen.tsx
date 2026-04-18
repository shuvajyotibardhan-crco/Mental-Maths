import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getAvailableOperations, OPERATION_LABELS } from '../../constants/gradeConfig'
import { generateQuestionBatch } from '../../engine/questionGenerator'
import { fetchSocialStudiesQuestions } from '../../firebase/socialStudies'
import { pickWord } from '../../firebase/wordOMeter'
import { createChallenge } from '../../firebase/challenge'
import { GradeSelector } from '../ui/GradeSelector'
import { GRADE_LETTER_OPTIONS } from '../../data/wordOMeterData'
import type { OperationType, Difficulty, GameMode, Grade } from '../../types'
import type { ChallengeSubject } from '../../types/challenge'

const SS_GRADES: Grade[] = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

interface ChallengeCreateScreenProps {
  onNavigate: (screen: string) => void
  onChallengeCreated: (gameCode: string) => void
}

const SUBJECTS: { value: ChallengeSubject; label: string; icon: string }[] = [
  { value: 'mentalMaths', label: 'Mental Maths', icon: '🧮' },
  { value: 'socialStudies', label: 'Social Studies', icon: '🌍' },
  { value: 'wordOMeter', label: 'Word-O-Meter', icon: '📝' },
]

const DIFFICULTIES: { value: Difficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: 'bg-emerald-100 text-emerald-700 ring-emerald-400' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700 ring-amber-400' },
  { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-700 ring-red-400' },
]

const MODES: { value: GameMode; label: string; description: string }[] = [
  { value: 'timed', label: 'Timed', description: '2 minutes' },
  { value: 'fixed', label: '20 Questions', description: 'No time limit' },
]

export function ChallengeCreateScreen({ onNavigate, onChallengeCreated }: ChallengeCreateScreenProps) {
  const { profile } = useAuth()

  const [subject, setSubject] = useState<ChallengeSubject>('mentalMaths')
  const [grade, setGrade] = useState<Grade>((profile?.grade ?? '3') as Grade)
  const [operation, setOperation] = useState<OperationType>('addition')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [mode, setMode] = useState<GameMode>('fixed')
  const [letterCount, setLetterCount] = useState(5)
  const [creating, setCreating] = useState(false)

  const availableOps = getAvailableOperations(grade)
  const isSS = subject === 'socialStudies'
  const isWOM = subject === 'wordOMeter'
  const womLetterOptions = GRADE_LETTER_OPTIONS[grade] ?? [3, 4, 5]

  function handleSubjectChange(s: ChallengeSubject) {
    setSubject(s)
    if (s === 'socialStudies' && !SS_GRADES.includes(grade)) setGrade('3')
  }

  function handleGradeChange(g: Grade) {
    setGrade(g)
    if (isWOM) {
      const options = GRADE_LETTER_OPTIONS[g] ?? [3, 4, 5]
      if (!options.includes(letterCount)) setLetterCount(options[0]!)
    }
  }

  async function handleCreate() {
    if (!profile || creating) return
    setCreating(true)

    try {
      if (isSS) {
        const questions = await fetchSocialStudiesQuestions(grade)
        const gameCode = await createChallenge(
          { subject: 'socialStudies', grade, operation: null, difficulty: null, mode: 'fixed' },
          questions,
          profile,
        )
        onChallengeCreated(gameCode)
      } else if (isWOM) {
        const word = pickWord(grade, letterCount)
        if (!word) { setCreating(false); return }
        const gameCode = await createChallenge(
          { subject: 'wordOMeter', grade, operation: null, difficulty: null, mode: 'fixed', letterCount },
          [word],
          profile,
        )
        onChallengeCreated(gameCode)
      } else {
        const count = mode === 'fixed' ? 20 : 60
        const questions = generateQuestionBatch(grade, operation, difficulty, count)
        const gameCode = await createChallenge(
          { subject: 'mentalMaths', grade, operation, difficulty, mode },
          questions,
          profile,
        )
        onChallengeCreated(gameCode)
      }
    } catch (err) {
      console.error('Failed to create challenge:', err)
      setCreating(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-primary-dark text-center">Challenge Friends</h2>
      <p className="text-center text-gray-500 text-sm">Set up the game, then share the code with friends!</p>

      {/* Subject Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
        <div className="grid grid-cols-2 gap-2">
          {SUBJECTS.map((s) => (
            <button
              key={s.value}
              onClick={() => handleSubjectChange(s.value)}
              className={`py-3 px-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                subject === s.value
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white/80 text-gray-700 hover:bg-white'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grade Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Grade</label>
        <GradeSelector
          value={grade}
          onChange={handleGradeChange}
          allowedGrades={isSS ? SS_GRADES : undefined}
        />
      </div>

      {/* Word-O-Meter only: Letter count */}
      {isWOM && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Word Length</label>
          <div className="grid grid-cols-6 gap-2">
            {womLetterOptions.map((lc) => (
              <button
                key={lc}
                onClick={() => setLetterCount(lc)}
                className={`py-3 rounded-2xl font-bold transition-all cursor-pointer ${
                  letterCount === lc
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                {lc}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mental Maths only: Operation */}
      {!isSS && !isWOM && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Operation</label>
          <div className="grid grid-cols-2 gap-2">
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
      )}

      {/* Mental Maths only: Difficulty */}
      {!isSS && !isWOM && (
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
      )}

      {/* Mental Maths only: Mode */}
      {!isSS && !isWOM && (
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
      )}

      {/* SS info card */}
      {isSS && (
        <div className="bg-teal-50 rounded-2xl p-4 text-sm text-teal-700 space-y-1">
          <p><span className="font-semibold">20 questions</span> · Multiple choice</p>
          <p>US & Colorado Curriculum · No time limit</p>
        </div>
      )}

      {/* WOM info card */}
      {isWOM && (
        <div className="bg-violet-50 rounded-2xl p-4 text-sm text-violet-700 space-y-1">
          <p><span className="font-semibold">Guess the same word</span> · Wordle-style</p>
          <p>Score based on attempts, hints used, and time</p>
        </div>
      )}

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={creating}
        className="w-full py-5 bg-success text-white font-bold text-xl rounded-3xl shadow-lg hover:bg-emerald-600 hover:shadow-xl active:scale-95 transition-all cursor-pointer disabled:opacity-50"
      >
        {creating ? 'Creating...' : 'Create Challenge'}
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
