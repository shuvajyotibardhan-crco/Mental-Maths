import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { purgeOldSessions } from '../../firebase/firestore'
import { GameProvider } from '../../context/GameContext'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { LoginScreen } from '../screens/LoginScreen'
import { RegisterScreen } from '../screens/RegisterScreen'
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { GameSetupScreen } from '../screens/GameSetupScreen'
import { GameScreen } from '../screens/GameScreen'
import { ResultsScreen } from '../screens/ResultsScreen'
import { HistoryScreen } from '../screens/HistoryScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { SettingsScreen } from '../screens/SettingsScreen'

export function AppShell() {
  const { user, profile, loading } = useAuth()
  const [screen, setScreen] = useState('home')
  const purgedRef = useRef(false)

  // Purge sessions older than 6 months on startup
  useEffect(() => {
    if (!profile || purgedRef.current) return
    purgedRef.current = true
    purgeOldSessions(profile.uid).catch(console.error)
  }, [profile])

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-2xl font-bold text-primary animate-pulse">Loading...</div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    if (screen === 'register') {
      return <RegisterScreen onNavigate={setScreen} />
    }
    return <LoginScreen onNavigate={setScreen} />
  }

  // Logged in but no profile yet
  if (!profile) {
    return <ProfileSetupScreen />
  }

  // Game screens don't show nav
  const isGameScreen = screen === 'game' || screen === 'results'

  return (
    <GameProvider>
      <div className="min-h-dvh flex flex-col">
        {!isGameScreen && <Header onNavigate={setScreen} />}
        <main className="flex-1 overflow-y-auto">
          {screen === 'home' && <HomeScreen onNavigate={setScreen} />}
          {screen === 'setup' && <GameSetupScreen onNavigate={setScreen} />}
          {screen === 'game' && <GameScreen onNavigate={setScreen} />}
          {screen === 'results' && <ResultsScreen onNavigate={setScreen} />}
          {screen === 'history' && <HistoryScreen />}
          {screen === 'profile' && <ProfileScreen />}
          {screen === 'settings' && <SettingsScreen />}
        </main>
        {!isGameScreen && <BottomNav currentScreen={screen} onNavigate={setScreen} />}
      </div>
    </GameProvider>
  )
}
