import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updateUserProfile, saveUsernameLookup, getEmailByUsername } from '../../firebase/firestore'
import { logoutUser, resetPassword } from '../../firebase/auth'
import { GRADE_OPTIONS, AVATAR_OPTIONS } from '../../constants/gradeConfig'
import type { Grade } from '../../types'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '****'
  if (local.length <= 4) return '****@' + domain
  return '****' + local.slice(-4) + '@' + domain
}

export function ProfileScreen() {
  const { profile, setProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.name ?? '')
  const [grade, setGrade] = useState<Grade>(profile?.grade ?? '3')
  const [avatar, setAvatar] = useState(profile?.avatar ?? AVATAR_OPTIONS[0]!)
  const [email, setEmail] = useState(profile?.email ?? '')
  const [parentEmail, setParentEmail] = useState(profile?.parentEmail ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setError('')

    const trimmedEmail = email.trim()
    const trimmedParentEmail = parentEmail.trim()
    const lookupChanged = trimmedEmail !== (profile.email ?? '') || trimmedParentEmail !== (profile.parentEmail ?? '')

    try {
      if (lookupChanged) {
        await saveUsernameLookup(profile.username, trimmedEmail || profile.email || '', trimmedParentEmail || undefined)
      }

      const updates = { name: name.trim(), grade, avatar, email: trimmedEmail || '', parentEmail: trimmedParentEmail || '' }
      await updateUserProfile(profile.uid, updates)
      setProfile({ ...profile, ...updates })
      setEditing(false)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/requires-recent-login') {
        setError('For security, please log out and log back in before changing your email.')
      } else {
        setError('Failed to save profile. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleResetPassword() {
    if (!profile) return
    setResetLoading(true)
    setResetMessage('')

    try {
      const email = await getEmailByUsername(profile.username)
      if (!email) {
        setResetMessage('No email linked to your account. Add an email first via Edit Profile.')
        return
      }
      await resetPassword(email)
      const masked = maskEmail(email)
      setResetMessage(`Reset email sent to ${masked}`)
    } catch {
      setResetMessage('Failed to send reset email. Please try again.')
    } finally {
      setResetLoading(false)
    }
  }

  async function handleLogout() {
    await logoutUser()
  }

  if (!profile) return null

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-primary-dark">Profile</h2>

      <div className="bg-white/90 rounded-3xl p-6 text-center space-y-4">
        {editing ? (
          <>
            {/* Avatar picker */}
            <div className="grid grid-cols-8 gap-2">
              {AVATAR_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`text-2xl p-1.5 rounded-xl transition-all cursor-pointer ${
                    avatar === a ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'hover:bg-gray-100'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-primary outline-none text-lg text-center"
              placeholder="Display Name"
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-primary outline-none text-base text-center"
              placeholder="Email (optional, for password reset)"
            />

            <div>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-primary outline-none text-base text-center"
                placeholder="Parent/guardian email (optional)"
              />
              <p className="text-xs text-orange-500 mt-1 text-center">
                Required if the account email is a child's Google account.
              </p>
            </div>

            {error && (
              <p className="text-wrong text-sm text-center bg-orange-50 rounded-xl p-2">{error}</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
              <div className="grid grid-cols-4 gap-2">
                {GRADE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGrade(opt.value)}
                    className={`py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      grade === opt.value
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {opt.value === 'KG' ? 'KG' : opt.value}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="flex-1 py-3 bg-success text-white font-bold rounded-2xl hover:bg-emerald-600 disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setName(profile.name)
                  setGrade(profile.grade)
                  setAvatar(profile.avatar)
                  setEmail(profile.email ?? '')
                  setParentEmail(profile.parentEmail ?? '')
                  setError('')
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-2xl hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-5xl">{profile.avatar}</div>
            <h3 className="text-xl font-bold text-gray-800">{profile.name}</h3>
            <p className="text-gray-500">Grade {profile.grade}</p>
            {profile.email && (
              <p className="text-sm text-gray-500">✉️ {profile.email}</p>
            )}
            {profile.parentEmail && (
              <p className="text-sm text-gray-500">👪 {profile.parentEmail}</p>
            )}
            <p className="text-sm text-gray-400">@{profile.username}</p>

            <button
              onClick={() => setEditing(true)}
              className="px-6 py-2 bg-primary/10 text-primary font-medium rounded-2xl hover:bg-primary/20 cursor-pointer"
            >
              Edit Profile
            </button>
          </>
        )}
      </div>

      <button
        onClick={handleResetPassword}
        disabled={resetLoading}
        className="w-full py-3 bg-white/80 text-primary font-medium rounded-2xl hover:bg-primary/10 cursor-pointer disabled:opacity-50"
      >
        {resetLoading ? 'Sending...' : '🔒 Reset Password'}
      </button>


      {resetMessage && (
        <p className={`text-sm text-center rounded-xl p-2 ${
          resetMessage.startsWith('Reset email') ? 'text-success bg-green-50' : 'text-wrong bg-orange-50'
        }`}>
          {resetMessage}
        </p>
      )}

      <button
        onClick={handleLogout}
        className="w-full py-3 text-red-500 font-medium hover:text-red-700 bg-white/80 rounded-2xl cursor-pointer"
      >
        Log Out
      </button>
    </div>
  )
}
