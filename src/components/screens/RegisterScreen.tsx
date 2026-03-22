import { useState, type FormEvent } from 'react'
import { registerUser, getFirebaseErrorMessage } from '../../firebase/auth'
import { saveUsernameLookup, checkUsernameExists } from '../../firebase/firestore'

interface RegisterScreenProps {
  onNavigate: (screen: string) => void
}

export function RegisterScreen({ onNavigate }: RegisterScreenProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const trimmedUsername = username.trim()
      const trimmedEmail = email.trim()

      // Check if username is already taken
      const exists = await checkUsernameExists(trimmedUsername)
      if (exists) {
        setError('This username is already taken. Please choose another one.')
        setLoading(false)
        return
      }

      await registerUser(trimmedUsername, password, trimmedUsername, trimmedEmail || undefined)
      // Save username → email mapping (always save, even without email, to reserve the username)
      await saveUsernameLookup(trimmedUsername, trimmedEmail || '')
      // Profile setup happens after auth state updates in AuthContext
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
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary-dark mb-2">Join Mental Maths!</h1>
          <p className="text-gray-500">Create your account to start playing.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-lg"
              placeholder="Choose a username"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-gray-400">(optional, for password reset)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-lg"
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-lg"
              placeholder="At least 6 characters"
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-lg"
              placeholder="Type password again"
              required
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-wrong text-sm text-center bg-orange-50 rounded-xl p-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-success text-white font-bold text-lg rounded-2xl hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-primary font-medium hover:underline cursor-pointer"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  )
}
