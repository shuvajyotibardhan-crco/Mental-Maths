interface BottomNavProps {
  currentScreen: string
  onNavigate: (screen: string) => void
  isAdmin?: boolean
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'history', label: 'History', icon: '📊' },
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

const ADMIN_ITEM = { id: 'admin', label: 'Admin', icon: '🛡️' }

export function BottomNav({ currentScreen, onNavigate, isAdmin }: BottomNavProps) {
  const items = isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS
  return (
    <nav className="flex items-center justify-around bg-white/80 backdrop-blur-sm border-t border-gray-200 py-2 px-1">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors cursor-pointer ${
            currentScreen === item.id
              ? 'bg-primary/15 text-primary-dark'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="text-xl">{item.icon}</span>
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
