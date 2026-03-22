import { useAuth } from '../../context/AuthContext'

interface HomeScreenProps {
  onNavigate: (screen: string) => void
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { profile } = useAuth()

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-8 min-h-[70vh]">
      <div className="text-center animate-bounce-in">
        <div className="text-6xl mb-4">{profile?.avatar}</div>
        <h1 className="text-2xl font-bold text-primary-dark">
          Hi {profile?.name}!
        </h1>
        <p className="text-gray-500 mt-1">
          Grade {profile?.grade} — Ready to practice?
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={() => onNavigate('setup')}
          className="w-full py-5 bg-primary text-white font-bold text-xl rounded-3xl shadow-lg hover:bg-primary-dark hover:shadow-xl active:scale-95 transition-all cursor-pointer"
        >
          Start Playing
        </button>

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
