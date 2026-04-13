import { useAuth } from '../../context/AuthContext'

interface SocialStudiesSetupScreenProps {
  onNavigate: (screen: string) => void
  onStart: () => void
}

const SS_GRADES = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

export function SocialStudiesSetupScreen({ onNavigate, onStart }: SocialStudiesSetupScreenProps) {
  const { profile } = useAuth()
  const grade = profile?.grade ?? 'KG'
  const eligible = SS_GRADES.includes(grade)

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-6 min-h-[70vh]">
      <div className="text-center animate-bounce-in">
        <div className="text-6xl mb-4">🌍</div>
        <h1 className="text-2xl font-bold text-primary-dark">Social Studies Quiz</h1>
        <p className="text-gray-500 mt-1">US & Colorado Curriculum</p>
      </div>

      <div className="w-full max-w-xs bg-white/80 rounded-3xl shadow p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Grade</span>
          <span className="font-bold text-primary-dark">Grade {grade}</span>
        </div>
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

      {!eligible && (
        <div className="w-full max-w-xs bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center text-amber-700 text-sm font-medium">
          Social Studies is available for Grade 3 and above.
        </div>
      )}

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={onStart}
          disabled={!eligible}
          className="w-full py-5 bg-teal-500 text-white font-bold text-xl rounded-3xl shadow-lg hover:bg-teal-600 hover:shadow-xl active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
