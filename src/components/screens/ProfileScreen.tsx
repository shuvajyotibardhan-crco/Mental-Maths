import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updateUserProfile } from '../../firebase/firestore'
import { logoutUser } from '../../firebase/auth'
import { GRADE_OPTIONS, AVATAR_OPTIONS } from '../../constants/gradeConfig'
import type { Grade } from '../../types'

export function ProfileScreen() {
  const { profile, setProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.name ?? '')
  const [grade, setGrade] = useState<Grade>(profile?.grade ?? '3')
  const [avatar, setAvatar] = useState(profile?.avatar ?? AVATAR_OPTIONS[0]!)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    const updates = { name: name.trim(), grade, avatar }
    await updateUserProfile(profile.uid, updates)
    setProfile({ ...profile, ...updates })
    setEditing(false)
    setSaving(false)
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
            />

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

      <button
        onClick={handleLogout}
        className="w-full py-3 text-red-500 font-medium hover:text-red-700 bg-white/80 rounded-2xl cursor-pointer"
      >
        Log Out
      </button>
    </div>
  )
}
