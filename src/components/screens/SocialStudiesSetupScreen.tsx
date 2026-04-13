import { GradeSelector } from '../ui/GradeSelector'
import type { Grade } from '../../types/question'

const SS_GRADES: Grade[] = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

interface SocialStudiesSetupScreenProps {
  onNavigate: (screen: string) => void
  selectedGrade: Grade
  onGradeChange: (grade: Grade) => void
  onStart: () => void
}

export function SocialStudiesSetupScreen({
  onNavigate,
  selectedGrade,
  onGradeChange,
  onStart,
}: SocialStudiesSetupScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 gap-6 min-h-[70vh]">
      <div className="text-center animate-bounce-in">
        <div className="text-6xl mb-4">🌍</div>
        <h1 className="text-2xl font-bold text-primary-dark">Social Studies Quiz</h1>
        <p className="text-gray-500 mt-1">US & Colorado Curriculum</p>
      </div>

      {/* Grade picker */}
      <div className="w-full max-w-xs">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Grade</label>
        <GradeSelector
          value={selectedGrade}
          onChange={onGradeChange}
          allowedGrades={SS_GRADES}
          selectedClass="bg-teal-500 text-white shadow-md"
        />
      </div>

      <div className="w-full max-w-xs bg-white/80 rounded-3xl shadow p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Questions</span>
          <span className="font-bold text-primary-dark">20</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Curriculum</span>
          <span className="font-bold text-primary-dark">US + Colorado</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Format</span>
          <span className="font-bold text-primary-dark">Multiple Choice</span>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={onStart}
          className="w-full py-5 bg-teal-500 text-white font-bold text-xl rounded-3xl shadow-lg hover:bg-teal-600 hover:shadow-xl active:scale-95 transition-all cursor-pointer"
        >
          Start Quiz
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
