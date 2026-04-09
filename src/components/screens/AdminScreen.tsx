import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getUserByUsername,
  adminResetPassword,
  adminMergeUsers,
  adminMoveScores,
  getAuditLog,
} from '../../firebase/admin'
import type { UserProfile } from '../../types'
import type { AuditEntry } from '../../types/admin'

type Tab = 'users' | 'audit'
type Action = 'reset_password' | 'merge' | 'move' | null

interface AdminScreenProps {
  onNavigate: (screen: string) => void
}

export function AdminScreen({ onNavigate }: AdminScreenProps) {
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('users')

  // Primary user search
  const [searchA, setSearchA] = useState('')
  const [userA, setUserA] = useState<UserProfile | null>(null)
  const [errorA, setErrorA] = useState('')
  const [loadingA, setLoadingA] = useState(false)

  // Active action
  const [action, setAction] = useState<Action>(null)

  // Secondary user search (merge / move)
  const [searchB, setSearchB] = useState('')
  const [userB, setUserB] = useState<UserProfile | null>(null)
  const [errorB, setErrorB] = useState('')
  const [loadingB, setLoadingB] = useState(false)

  // Action form
  const [notes, setNotes] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // Audit log
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  useEffect(() => {
    if (tab === 'audit') loadAudit()
  }, [tab])

  async function loadAudit() {
    setAuditLoading(true)
    try {
      setAuditEntries(await getAuditLog(50))
    } catch (err) {
      console.error(err)
    } finally {
      setAuditLoading(false)
    }
  }

  async function handleSearchA() {
    const username = searchA.trim()
    if (!username) return
    setLoadingA(true)
    setErrorA('')
    setUserA(null)
    setAction(null)
    setResult(null)
    try {
      const found = await getUserByUsername(username)
      if (!found) setErrorA(`No user found: "${username}"`)
      else setUserA(found)
    } finally {
      setLoadingA(false)
    }
  }

  async function handleSearchB() {
    const username = searchB.trim()
    if (!username) return
    setLoadingB(true)
    setErrorB('')
    setUserB(null)
    try {
      const found = await getUserByUsername(username)
      if (!found) setErrorB(`No user found: "${username}"`)
      else if (found.uid === userA?.uid) setErrorB('Cannot select the same user twice.')
      else setUserB(found)
    } finally {
      setLoadingB(false)
    }
  }

  function selectAction(a: Action) {
    setAction(a)
    setUserB(null)
    setSearchB('')
    setErrorB('')
    setNotes('')
    setNewPassword('')
    setConfirmPassword('')
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setResult(null)
  }

  async function handleExecute() {
    if (!profile || !userA) return
    if ((action === 'merge' || action === 'move') && !userB) return
    if (!notes.trim()) return

    setExecuting(true)
    setResult(null)

    try {
      if (action === 'reset_password') {
        await adminResetPassword(userA, profile, newPassword, notes.trim())
        setResult({ ok: true, msg: `Password updated for @${userA.username}. User can now log in with the new password.` })
      } else if (action === 'merge' && userB) {
        const details = await adminMergeUsers(userA, userB, profile, notes.trim())
        setResult({ ok: true, msg: details })
      } else if (action === 'move' && userB) {
        const details = await adminMoveScores(userA, userB, profile, notes.trim())
        setResult({ ok: true, msg: details })
      }

      setNotes('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Operation failed.' })
    } finally {
      setExecuting(false)
    }
  }

  const needsSecondUser = action === 'merge' || action === 'move'
  const passwordValid =
    action !== 'reset_password' ||
    (newPassword.length >= 6 && newPassword === confirmPassword)
  const canConfirm =
    !executing &&
    notes.trim().length > 0 &&
    (!needsSecondUser || !!userB) &&
    passwordValid

  return (
    <div className="p-4 pb-10 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => onNavigate('home')}
          className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-primary-dark">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['users', 'audit'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl font-medium text-sm cursor-pointer transition-colors ${
              tab === t
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white/70 text-gray-600 hover:bg-white'
            }`}
          >
            {t === 'users' ? '👤 Users' : '📋 Audit Log'}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ─────────────────────────────────── */}
      {tab === 'users' && (
        <div className="space-y-4">

          {/* Primary user search */}
          <div className="bg-white/90 rounded-2xl p-4 space-y-3 shadow-sm">
            <p className="text-sm font-semibold text-gray-600">Find User</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchA}
                onChange={(e) => setSearchA(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchA()}
                placeholder="Username..."
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={handleSearchA}
                disabled={loadingA || !searchA.trim()}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50 cursor-pointer"
              >
                {loadingA ? '…' : 'Search'}
              </button>
            </div>
            {errorA && <p className="text-red-500 text-sm">{errorA}</p>}
          </div>

          {/* User A card + action buttons */}
          {userA && (
            <div className="bg-white/90 rounded-2xl p-4 space-y-3 shadow-sm">
              <UserCard user={userA} label="User A" />
              <div className="grid grid-cols-3 gap-2 pt-1">
                <ActionBtn
                  label="Reset Password"
                  icon="🔑"
                  active={action === 'reset_password'}
                  onClick={() => selectAction('reset_password')}
                />
                <ActionBtn
                  label="Merge Users"
                  icon="🔀"
                  active={action === 'merge'}
                  onClick={() => selectAction('merge')}
                />
                <ActionBtn
                  label="Move Scores"
                  icon="📦"
                  active={action === 'move'}
                  onClick={() => selectAction('move')}
                />
              </div>
            </div>
          )}

          {/* Action panel */}
          {action && userA && (
            <div className="bg-white/90 rounded-2xl p-4 space-y-4 shadow-sm">
              <p className="font-semibold text-gray-700">
                {action === 'reset_password' && '🔑 Reset Password'}
                {action === 'merge' && '🔀 Merge Users'}
                {action === 'move' && '📦 Move Scores'}
              </p>

              {/* Contextual description */}
              {action === 'merge' && (
                <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl leading-relaxed">
                  Best scores from both accounts are kept under <strong>User B</strong>. All of User A's sessions are transferred to User B. User A is marked as merged.
                </p>
              )}
              {action === 'move' && (
                <p className="text-xs text-blue-700 bg-blue-50 p-3 rounded-xl leading-relaxed">
                  All sessions and high scores are transferred from User A to User B. User A's high scores are cleared. User A's account is left intact.
                </p>
              )}

              {/* Secondary user search */}
              {needsSecondUser && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">
                    {action === 'merge'
                      ? 'Merge into — User B (keeps identity):'
                      : 'Move scores to — User B:'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchB}
                      onChange={(e) => setSearchB(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchB()}
                      placeholder="Username..."
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      onClick={handleSearchB}
                      disabled={loadingB || !searchB.trim()}
                      className="px-4 py-2 bg-gray-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 cursor-pointer"
                    >
                      {loadingB ? '…' : 'Find'}
                    </button>
                  </div>
                  {errorB && <p className="text-red-500 text-sm">{errorB}</p>}
                  {userB && <UserCard user={userB} label="User B" />}
                </div>
              )}

              {/* New password (reset only) */}
              {action === 'reset_password' && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-600">
                      New Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3 py-2 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showNewPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-600">
                      Confirm Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full px-3 py-2 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-red-500 text-xs">Passwords do not match.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">
                  Reason / Notes <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe the reason for this action…"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              {/* Confirm */}
              <button
                onClick={handleExecute}
                disabled={!canConfirm}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-40 cursor-pointer hover:bg-primary-dark active:scale-95 transition-all"
              >
                {executing ? 'Working…' : 'Confirm Action'}
              </button>

              {/* Result */}
              {result && (
                <div
                  className={`p-3 rounded-xl text-sm font-medium leading-relaxed ${
                    result.ok
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {result.ok ? '✅ ' : '❌ '}
                  {result.msg}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── AUDIT LOG TAB ──────────────────────────────── */}
      {tab === 'audit' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-700">Recent Actions</p>
            <button
              onClick={loadAudit}
              className="text-sm text-primary cursor-pointer hover:underline"
            >
              Refresh
            </button>
          </div>

          {auditLoading && (
            <p className="text-center text-gray-400 py-10">Loading…</p>
          )}
          {!auditLoading && auditEntries.length === 0 && (
            <p className="text-center text-gray-400 py-10">No audit entries yet.</p>
          )}
          {auditEntries.map((entry) => (
            <AuditCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────

function UserCard({ user, label }: { user: UserProfile; label: string }) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
      <span className="text-3xl">{user.avatar}</span>
      <div>
        <p className="font-semibold text-gray-800">
          {user.name}{' '}
          <span className="text-gray-400 font-normal text-sm">@{user.username}</span>
        </p>
        <p className="text-xs text-gray-500">Grade {user.grade} · {label}</p>
      </div>
    </div>
  )
}

function ActionBtn({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
        active
          ? 'bg-primary text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  )
}

const ACTION_LABELS: Record<string, string> = {
  password_reset: '🔑 Password Reset',
  merge_users: '🔀 Merge Users',
  move_scores: '📦 Move Scores',
}

function AuditCard({ entry }: { entry: AuditEntry }) {
  const date = new Date(entry.timestamp).toLocaleString()

  return (
    <div className="bg-white/90 rounded-2xl p-4 space-y-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            entry.outcome === 'success'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {entry.outcome === 'success' ? '✓ Success' : '✗ Failed'}
        </span>
        <span className="text-xs text-gray-400 shrink-0">{date}</span>
      </div>

      <p className="font-semibold text-gray-800">
        {ACTION_LABELS[entry.action] ?? entry.action}
      </p>

      <p className="text-xs text-gray-500">
        By <strong>@{entry.adminUsername}</strong>
        {' · '}
        {entry.affectedUsers.map((u) => `@${u.username}`).join(' → ')}
      </p>

      <p className="text-sm text-gray-700">{entry.details}</p>

      {entry.notes && (
        <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-2">
          "{entry.notes}"
        </p>
      )}

      {entry.supportingFileUrl && (
        <a
          href={entry.supportingFileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline pt-1"
        >
          📎 {entry.supportingFileName ?? 'Supporting document'}
        </a>
      )}
    </div>
  )
}
