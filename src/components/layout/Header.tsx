import { useAuth } from '../../context/AuthContext'

interface HeaderProps {
  onNavigate: (screen: string) => void
}

export function Header({ onNavigate }: HeaderProps) {
  const { profile } = useAuth()

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white/70 backdrop-blur-sm shadow-sm">
      <button
        onClick={() => onNavigate('home')}
        className="text-xl font-bold text-primary-dark cursor-pointer"
      >
        Mental Maths
      </button>
      {profile && (
        <button
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
        >
          <span className="text-lg">{profile.avatar}</span>
          <span className="text-sm font-medium text-primary-dark">{profile.name}</span>
        </button>
      )}
    </header>
  )
}
