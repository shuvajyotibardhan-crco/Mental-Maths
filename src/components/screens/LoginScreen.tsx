import { useState, type FormEvent } from 'react'
import { loginUser, getFirebaseErrorMessage } from '../../firebase/auth'

interface LoginScreenProps {
  onNavigate: (screen: string) => void
}

export function LoginScreen({ onNavigate }: LoginScreenProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await loginUser(username.trim(), password)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(getFirebaseErrorMessage(code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur rounded-3xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-dark mb-2">Mental Maths</h1>
          <p className="text-gray-500">Welcome back! Let's practice.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-lg"
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-lg"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
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

        <p className="text-center text-gray-500 mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-primary font-medium hover:underline cursor-pointer"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  )
}
