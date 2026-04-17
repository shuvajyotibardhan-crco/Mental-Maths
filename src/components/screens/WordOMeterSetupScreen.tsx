import { GradeSelector } from '../ui/GradeSelector'
import { GRADE_LETTER_OPTIONS } from '../../data/wordOMeterData'
import type { Grade } from '../../types/question'

const WOM_GRADES: Grade[] = ['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

interface WordOMeterSetupScreenProps {
  onNavigate: (screen: string) => void
  selectedGrade: Grade
  selectedLetterCount: number
  onGradeChange: (grade: Grade) => void
  onLetterCountChange: (count: number) => void
  onStart: () => void
}

export function WordOMeterSetupScreen({
  onNavigate,
  selectedGrade,
  selectedLetterCount,
  onGradeChange,
  onLetterCountChange,
  onStart,
}: WordOMeterSetupScreenProps) {
  const letterOptions = GRADE_LETTER_OPTIONS[selectedGrade] ?? [3, 4, 5]

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-6 min-h-[70vh]">
      <div className="text-center animate-bounce-in">
        <div className="text-6xl mb-4">🔤</div>
        <h1 className="text-2xl font-bold text-primary-dark">Word-O-Meter</h1>
        <p className="text-gray-500 mt-1">Guess the hidden word!</p>
      </div>

      <div className="w-full max-w-xs">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Grade</label>
        <GradeSelector
          value={selectedGrade}
          onChange={onGradeChange}
          allowedGrades={WOM_GRADES}
          selectedClass="bg-amber-500 text-white shadow-md"
        />
      </div>

      <div className="w-full max-w-xs">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Letter Count</label>
        <div className="flex gap-2">
          {letterOptions.map((count) => (
            <button
              key={count}
              onClick={() => onLetterCountChange(count)}
              className={`flex-1 py-3 rounded-2xl font-bold text-lg transition-all cursor-pointer ${
                selectedLetterCount === count
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white/80 text-gray-600 hover:bg-amber-50'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-xs bg-white/80 rounded-3xl shadow p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Attempts</span>
          <span className="font-bold text-primary-dark">{selectedLetterCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Letters</span>
          <span className="font-bold text-primary-dark">{selectedLetterCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Format</span>
          <span className="font-bold text-primary-dark">Wordle-style</span>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={onStart}
          className="w-full py-5 bg-amber-500 text-white font-bold text-xl rounded-3xl shadow-lg hover:bg-amber-600 hover:shadow-xl active:scale-95 transition-all cursor-pointer"
        >
          Start Game
        </button>
        <button
          onClick={() => onNavigate('home')}
          className="w-full py-4 bg-white/80 text-primary-dark font-semibold text-lg rounded-3xl shadow hover:shadow-md active:scale-95 transition-all cursor-pointer"
        >
          Back
        </button>
      </div>
    </div>
  )
}
