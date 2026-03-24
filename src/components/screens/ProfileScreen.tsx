import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updateUserProfile } from '../../firebase/firestore'
import { logoutUser, changePassword, getFirebaseErrorMessage } from '../../firebase/auth'
import { GRADE_OPTIONS, AVATAR_OPTIONS } from '../../constants/gradeConfig'
import type { Grade } from '../../types'

export function ProfileScreen() {
  const { profile, setProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.name ?? '')
  const [grade, setGrade] = useState<Grade>(profile?.grade ?? '3')
  const [avatar, setAvatar] = useState(profile?.avatar ?? AVATAR_OPTIONS[0]!)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setError('')
    try {
      const updates = { name: name.trim(), grade, avatar }
      await updateUserProfile(profile.uid, updates)
      setProfile({ ...profile, ...updates })
      setEditing(false)
    } catch {
      setError('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setPasswordLoading(true)
    try {
      await changePassword(newPassword)
      setPasswordSuccess('Password changed successfully.')
      setNewPassword('')
      setConfirmPassword('')
      setChangingPassword(false)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/requires-recent-login') {
        setPasswordError('Please log out and log back in before changing your password.')
      } else {
        setPasswordError(getFirebaseErrorMessage(code))
      }
    } finally {
      setPasswordLoading(false)
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

      {/* Change Password */}
      {changingPassword ? (
        <div className="bg-white/90 rounded-3xl p-6 space-y-3">
          <h3 className="text-base font-semibold text-gray-700">Change Password</h3>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-primary outline-none text-base pr-16"
              placeholder="New password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-primary outline-none text-base"
            placeholder="Confirm new password"
            autoComplete="new-password"
          />

          {passwordError && (
            <p className="text-wrong text-sm text-center bg-orange-50 rounded-xl p-2">{passwordError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleChangePassword}
              disabled={passwordLoading}
              className="flex-1 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
            >
              {passwordLoading ? 'Saving...' : 'Save Password'}
            </button>
            <button
              onClick={() => {
                setChangingPassword(false)
                setNewPassword('')
                setConfirmPassword('')
                setPasswordError('')
              }}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-2xl hover:bg-gray-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setChangingPassword(true); setPasswordSuccess('') }}
          className="w-full py-3 bg-white/80 text-primary font-medium rounded-2xl hover:bg-primary/10 cursor-pointer"
        >
          Change Password
        </button>
      )}

      {passwordSuccess && (
        <p className="text-success text-sm text-center bg-green-50 rounded-xl p-2">{passwordSuccess}</p>
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
