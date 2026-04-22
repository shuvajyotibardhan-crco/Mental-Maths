import { useAuth } from '../../context/AuthContext'

interface HomeScreenProps {
  onNavigate: (screen: string) => void
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { profile } = useAuth()
  const grade = profile?.grade ?? 'KG'

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-8 min-h-[70vh]">
      <div className="text-center animate-bounce-in">
        <div className="text-6xl mb-4">{profile?.avatar}</div>
        <h1 className="text-2xl font-bold text-primary-dark">
          Hi {profile?.name}!
        </h1>
        <p className="text-gray-500 mt-1">
          Grade {grade} — What would you like to practice?
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        {/* Subject cards — grade is chosen per quiz on the setup screen */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('setup')}
            className="flex flex-col items-center gap-2 py-5 bg-primary text-white font-bold rounded-3xl shadow-lg hover:bg-primary-dark hover:shadow-xl active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-3xl">🧮</span>
            <span className="text-sm">Mental Maths</span>
          </button>

          <button
            onClick={() => onNavigate('ss-setup')}
            className="flex flex-col items-center gap-2 py-5 bg-teal-500 text-white font-bold rounded-3xl shadow-lg hover:bg-teal-600 hover:shadow-xl active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-3xl">🌍</span>
            <span className="text-sm">Social Studies</span>
          </button>

          <button
            onClick={() => onNavigate('sci-setup')}
            className="flex flex-col items-center gap-2 py-5 bg-orange-500 text-white font-bold rounded-3xl shadow-lg hover:bg-orange-600 hover:shadow-xl active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-3xl">🔬</span>
            <span className="text-sm">Science</span>
          </button>

          <button
            onClick={() => onNavigate('wom-setup')}
            className="flex flex-col items-center gap-2 py-5 bg-amber-500 text-white font-bold rounded-3xl shadow-lg hover:bg-amber-600 hover:shadow-xl active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-3xl">🔤</span>
            <span className="text-sm">Word-O-Meter</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('challenge-create')}
            className="py-4 bg-purple-500 text-white font-semibold text-base rounded-3xl shadow hover:bg-purple-600 hover:shadow-md active:scale-95 transition-all cursor-pointer"
          >
            Challenge Friends
          </button>
          <button
            onClick={() => onNavigate('challenge-join')}
            className="py-4 bg-indigo-500 text-white font-semibold text-base rounded-3xl shadow hover:bg-indigo-600 hover:shadow-md active:scale-95 transition-all cursor-pointer"
          >
            Join Challenge
          </button>
        </div>

        <button
          onClick={() => onNavigate('history')}
          className="w-full py-4 bg-white/80 text-primary-dark font-semibold text-lg rounded-3xl shadow hover:shadow-md active:scale-95 transition-all cursor-pointer"
        >
          View History
        </button>
      </div>
    </div>
  )
}
