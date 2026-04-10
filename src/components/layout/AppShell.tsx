import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { purgeOldSessions } from '../../firebase/firestore'
import { checkIsAdmin, checkIsSuperAdmin } from '../../firebase/admin'
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
import { ChallengeCreateScreen } from '../screens/ChallengeCreateScreen'
import { JoinChallengeScreen } from '../screens/JoinChallengeScreen'
import { ChallengeLobbyScreen } from '../screens/ChallengeLobbyScreen'
import { ChallengeGameScreen } from '../screens/ChallengeGameScreen'
import { ChallengeResultsScreen } from '../screens/ChallengeResultsScreen'
import { ContactScreen } from '../screens/ContactScreen'
import { AdminScreen } from '../screens/AdminScreen'

export function AppShell() {
  const { user, profile, loading } = useAuth()
  const [screen, setScreen] = useState('home')
  const [challengeCode, setChallengeCode] = useState<string | null>(null)
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  const [userIsSuperAdmin, setUserIsSuperAdmin] = useState(false)
  const purgedRef = useRef(false)

  // Purge sessions older than 6 months on startup
  useEffect(() => {
    if (!profile || purgedRef.current) return
    purgedRef.current = true
    purgeOldSessions(profile.uid).catch((err) => console.warn('Purge skipped:', err))
    checkIsAdmin(profile.uid).then(setUserIsAdmin).catch(() => setUserIsAdmin(false))
    checkIsSuperAdmin(profile.uid).then(setUserIsSuperAdmin).catch(() => setUserIsSuperAdmin(false))
  }, [profile])

  // Reset screen to home when user logs in (screen might be stuck on 'register' or 'login')
  useEffect(() => {
    if (user && profile && (screen === 'register' || screen === 'login')) {
      setScreen('home')
    }
  }, [user, profile, screen])

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-2xl font-bold text-primary animate-pulse">Loading...</div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    if (screen === 'register') return <RegisterScreen onNavigate={setScreen} />
    if (screen === 'contact') return <ContactScreen onNavigate={setScreen} />
    return <LoginScreen onNavigate={setScreen} />
  }

  // Logged in but no profile yet
  if (!profile) {
    return <ProfileSetupScreen />
  }

  // Only hide nav during active gameplay
  const isGameScreen = screen === 'game' || screen === 'challenge-game'

  function handleChallengeCreated(gameCode: string) {
    setChallengeCode(gameCode)
    setScreen('challenge-lobby')
  }

  function handleChallengeJoined(gameCode: string) {
    setChallengeCode(gameCode)
    setScreen('challenge-lobby')
  }

  return (
    <GameProvider>
      <div className="h-dvh flex flex-col">
        {!isGameScreen && <Header onNavigate={setScreen} />}

        <main className="flex-1 overflow-y-auto">
          {screen === 'home' && <HomeScreen onNavigate={setScreen} />}
          {screen === 'setup' && <GameSetupScreen onNavigate={setScreen} />}
          {screen === 'game' && <GameScreen onNavigate={setScreen} />}
          {screen === 'results' && <ResultsScreen onNavigate={setScreen} />}
          {screen === 'history' && <HistoryScreen />}
          {screen === 'profile' && <ProfileScreen />}
          {screen === 'settings' && <SettingsScreen onNavigate={setScreen} />}
          {screen === 'contact' && <ContactScreen onNavigate={setScreen} />}
          {screen === 'challenge-create' && (
            <ChallengeCreateScreen onNavigate={setScreen} onChallengeCreated={handleChallengeCreated} />
          )}
          {screen === 'challenge-join' && (
            <JoinChallengeScreen onNavigate={setScreen} onChallengeJoined={handleChallengeJoined} />
          )}
          {screen === 'challenge-lobby' && challengeCode && (
            <ChallengeLobbyScreen gameCode={challengeCode} onNavigate={setScreen} />
          )}
          {screen === 'challenge-game' && challengeCode && (
            <ChallengeGameScreen gameCode={challengeCode} onNavigate={setScreen} />
          )}
          {screen === 'challenge-results' && challengeCode && (
            <ChallengeResultsScreen gameCode={challengeCode} onNavigate={setScreen} />
          )}
          {screen === 'admin' && userIsAdmin && <AdminScreen onNavigate={setScreen} isSuperAdmin={userIsSuperAdmin} />}
        </main>
        {!isGameScreen && (
          <BottomNav currentScreen={screen} onNavigate={setScreen} isAdmin={userIsAdmin} />
        )}
      </div>
    </GameProvider>
  )
}
