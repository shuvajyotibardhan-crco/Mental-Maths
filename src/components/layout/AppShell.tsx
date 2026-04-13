import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { purgeOldSessions } from '../../firebase/firestore'
import { checkIsAdmin, checkIsSuperAdmin } from '../../firebase/admin'
import { GameProvider } from '../../context/GameContext'
import { useSocialStudiesGame } from '../../hooks/useSocialStudiesGame'
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
import { SocialStudiesSetupScreen } from '../screens/SocialStudiesSetupScreen'
import { SocialStudiesGameScreen } from '../screens/SocialStudiesGameScreen'
import { SocialStudiesResultsScreen } from '../screens/SocialStudiesResultsScreen'
import type { Grade } from '../../types'

function SocialStudiesShell({
  screen,
  setScreen,
}: {
  screen: string
  setScreen: (s: string) => void
}) {
  const { user, profile } = useAuth()
  // Grade is chosen per-quiz on the setup screen; default to profile grade or 3
  const [selectedGrade, setSelectedGrade] = useState<Grade>(
    (): Grade => {
      const g = profile?.grade ?? '3'
      return (['3','4','5','6','7','8','9','10','11','12'].includes(g) ? g : '3') as Grade
    },
  )

  const { state, startGame, selectAnswer, advance, forceFinish, reset } = useSocialStudiesGame(
    user?.uid ?? '',
  )

  const handleStart = useCallback(async () => {
    await startGame(selectedGrade)
    setScreen('ss-game')
  }, [startGame, selectedGrade, setScreen])

  const handlePlayAgain = useCallback(() => {
    reset()
    setScreen('ss-setup')
  }, [reset, setScreen])

  // When game finishes (natural or forced), navigate to results
  useEffect(() => {
    if (state.status === 'finished' && screen === 'ss-game') {
      setScreen('ss-results')
    }
  }, [state.status, screen, setScreen])

  if (screen === 'ss-setup') {
    return (
      <SocialStudiesSetupScreen
        onNavigate={setScreen}
        selectedGrade={selectedGrade}
        onGradeChange={setSelectedGrade}
        onStart={handleStart}
      />
    )
  }
  if (screen === 'ss-game') {
    return (
      <SocialStudiesGameScreen
        gameState={state}
        onSelectAnswer={selectAnswer}
        onAdvance={advance}
        onEndGame={forceFinish}
        onNavigate={setScreen}
      />
    )
  }
  if (screen === 'ss-results') {
    return (
      <SocialStudiesResultsScreen
        gameState={state}
        onPlayAgain={handlePlayAgain}
        onNavigate={setScreen}
      />
    )
  }
  return null
}

export function AppShell() {
  const { user, profile, loading } = useAuth()
  const [screen, setScreen] = useState('home')
  const [challengeCode, setChallengeCode] = useState<string | null>(null)
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  const [userIsSuperAdmin, setUserIsSuperAdmin] = useState(false)
  const purgedRef = useRef(false)

  // Purge sessions older than 6 months — only once per app mount
  useEffect(() => {
    if (!profile || purgedRef.current) return
    purgedRef.current = true
    purgeOldSessions(profile.uid).catch((err) => console.warn('Purge skipped:', err))
  }, [profile])

  // Admin status — re-checked every time the logged-in user changes so stale
  // state from a previous session is never carried over to the next user.
  useEffect(() => {
    if (!profile) {
      setUserIsAdmin(false)
      setUserIsSuperAdmin(false)
      return
    }
    const uid = profile.uid
    setUserIsAdmin(false)
    setUserIsSuperAdmin(false)
    checkIsAdmin(uid).then(setUserIsAdmin).catch(() => setUserIsAdmin(false))
    checkIsSuperAdmin(uid).then(setUserIsSuperAdmin).catch(() => setUserIsSuperAdmin(false))
  }, [profile?.uid])

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

  const isSsScreen = screen === 'ss-game'
  // Only hide nav during active gameplay
  const isGameScreen = screen === 'game' || screen === 'challenge-game' || isSsScreen

  function handleChallengeCreated(gameCode: string) {
    setChallengeCode(gameCode)
    setScreen('challenge-lobby')
  }

  function handleChallengeJoined(gameCode: string) {
    setChallengeCode(gameCode)
    setScreen('challenge-lobby')
  }

  const isSocialStudiesScreen = screen === 'ss-setup' || screen === 'ss-game' || screen === 'ss-results'

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
          {screen === 'profile' && <ProfileScreen isSuperAdmin={userIsSuperAdmin} />}
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
          {isSocialStudiesScreen && (
            <SocialStudiesShell screen={screen} setScreen={setScreen} />
          )}
        </main>
        {!isGameScreen && (
          <BottomNav currentScreen={screen} onNavigate={setScreen} isAdmin={userIsAdmin} />
        )}
      </div>
    </GameProvider>
  )
}
