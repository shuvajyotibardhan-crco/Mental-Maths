import { useState, type FormEvent } from 'react'
import { loginUser, loginWithEmail, resetPassword, getFirebaseErrorMessage } from '../../firebase/auth'
import { getEmailByUsername } from '../../firebase/firestore'

interface LoginScreenProps {
  onNavigate: (screen: string) => void
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '****'
  if (local.length <= 4) return '****@' + domain
  return '****' + local.slice(-4) + '@' + domain
}

export function LoginScreen({ onNavigate }: LoginScreenProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Forgot password state
  const [showReset, setShowReset] = useState(false)
  const [resetUsername, setResetUsername] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [resetError, setResetError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const input = username.trim()

    try {
      if (input.includes('@')) {
        await loginWithEmail(input, password)
      } else {
        await loginUser(input, password)
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(getFirebaseErrorMessage(code))
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault()
    setResetError('')
    setResetMessage('')

    const uname = resetUsername.trim()
    if (!uname) {
      setResetError('Please enter your username.')
      return
    }

    setResetLoading(true)
    try {
      const email = await getEmailByUsername(uname)

      if (!email) {
        setResetError('No email linked to this account. If you signed up without an email, please create a new account.')
        return
      }

      await resetPassword(email)
      setResetMessage(`Reset email sent to ${maskEmail(email)}`)
    } catch {
      setResetError('Something went wrong. Please try again.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur rounded-3xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-dark mb-2">Mental Maths</h1>
          <p className="text-gray-500">Welcome back! Let's practice.</p>
        </div>

        {showReset ? (
          <>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-lg"
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>

              {resetError && (
                <p className="text-wrong text-sm text-center bg-orange-50 rounded-xl p-2">{resetError}</p>
              )}

              {resetMessage && (
                <p className="text-success text-sm text-center bg-green-50 rounded-xl p-2">{resetMessage}</p>
              )}

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3 bg-primary text-white font-bold text-lg rounded-2xl hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
              >
                {resetLoading ? 'Sending...' : 'Reset Password'}
              </button>
            </form>

            <p className="text-center text-gray-500 mt-4">
              <button
                onClick={() => {
                  setShowReset(false)
                  setResetError('')
                  setResetMessage('')
                }}
                className="text-primary font-medium hover:underline cursor-pointer"
              >
                ← Back to Login
              </button>
            </p>
          </>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-lg"
                  placeholder="Enter your username or email"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-lg pr-16"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-wrong text-sm text-center bg-orange-50 rounded-xl p-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white font-bold text-lg rounded-2xl hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            <button
              onClick={() => setShowReset(true)}
              className="w-full text-center text-sm text-gray-400 mt-3 hover:text-primary cursor-pointer"
            >
              Forgot Password?
            </button>

            <p className="text-center text-gray-500 mt-4">
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate('register')}
                className="text-primary font-medium hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
