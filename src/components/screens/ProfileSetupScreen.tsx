import { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createUserProfile } from '../../firebase/firestore'
import { GRADE_OPTIONS, AVATAR_OPTIONS } from '../../constants/gradeConfig'
import type { Grade, UserProfile } from '../../types'

export function ProfileSetupScreen() {
  const { user, setProfile } = useAuth()
  const [name, setName] = useState(user?.displayName ?? '')
  const [grade, setGrade] = useState<Grade>('3')
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]!)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    const profile: UserProfile = {
      uid: user.uid,
      username: user.displayName ?? name,
      name: name.trim(),
      grade,
      avatar,
      email: user.email?.endsWith('@mentalmaths.app') ? '' : user.email ?? '',
      createdAt: Date.now(),
    }

    await createUserProfile(profile)
    setProfile(profile)
    setLoading(false)
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-3xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary-dark mb-2">Set Up Your Profile</h1>
          <p className="text-gray-500">Tell us about yourself!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-lg"
              placeholder="What should we call you?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Grade</label>
            <div className="grid grid-cols-4 gap-2">
              {GRADE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGrade(opt.value)}
                  className={`py-2 px-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    grade === opt.value
                      ? 'bg-primary text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {opt.value === 'KG' ? 'KG' : opt.value}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pick an Avatar</label>
            <div className="grid grid-cols-8 gap-2">
              {AVATAR_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`text-2xl p-2 rounded-xl transition-all cursor-pointer ${
                    avatar === a
                      ? 'bg-primary/20 ring-2 ring-primary scale-110'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 bg-success text-white font-bold text-lg rounded-2xl hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Saving...' : "Let's Go!"}
          </button>
        </form>
      </div>
    </div>
  )
}
