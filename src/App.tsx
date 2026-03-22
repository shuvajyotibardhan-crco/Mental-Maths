import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { AppShell } from './components/layout/AppShell'

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </SettingsProvider>
  )
}
