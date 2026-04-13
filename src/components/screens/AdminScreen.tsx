import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  searchUsersByPrefix,
  adminResetPassword,
  adminMergeUsers,
  adminMoveScores,
  adminDeleteUser,
  getDashboardSessions,
  getAdminList,
  addAdmin,
  removeAdmin,
  type DashboardFilters,
  type AdminRecord,
} from '../../firebase/admin'
import { getAuditLog } from '../../firebase/admin'
import type { UserProfile } from '../../types'
import type { AuditEntry } from '../../types/admin'
import type { SessionRecord } from '../../types/session'
import type { OperationType, Difficulty, Grade } from '../../types/question'

type Tab = 'users' | 'dashboard' | 'audit' | 'admins'
type Action = 'reset_password' | 'merge' | 'move' | 'delete_user' | null

interface AdminScreenProps {
  onNavigate: (screen: string) => void
  isSuperAdmin?: boolean
}

const OPERATION_LABELS: Record<OperationType, string> = {
  addition: '+ Addition',
  subtraction: '− Subtraction',
  multiplication: '× Multiplication',
  division: '÷ Division',
  percentage: '% Percentage',
  squareRoot: '√ Square Root',
  power: '^ Power',
  mix: '🎲 Mix',
}

const GRADE_OPTIONS: Grade[] = ['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const DIFFICULTY_OPTIONS: Difficulty[] = ['easy', 'medium', 'hard']
const OPERATION_OPTIONS = Object.keys(OPERATION_LABELS) as OperationType[]

function toDateInputValue(ms: number) {
  return new Date(ms).toISOString().slice(0, 10)
}

export function AdminScreen({ onNavigate, isSuperAdmin = false }: AdminScreenProps) {
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('users')

  // Primary user search
  const [searchA, setSearchA] = useState('')
  const [userA, setUserA] = useState<UserProfile | null>(null)
  const [resultsA, setResultsA] = useState<UserProfile[]>([])
  const [errorA, setErrorA] = useState('')
  const [loadingA, setLoadingA] = useState(false)

  // Active action
  const [action, setAction] = useState<Action>(null)

  // Secondary user search (merge / move)
  const [searchB, setSearchB] = useState('')
  const [userB, setUserB] = useState<UserProfile | null>(null)
  const [resultsB, setResultsB] = useState<UserProfile[]>([])
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

  // Dashboard
  const now = Date.now()
  const defaultStart = now - 60 * 24 * 60 * 60 * 1000
  const [dashFromDate, setDashFromDate] = useState(toDateInputValue(defaultStart))
  const [dashToDate, setDashToDate] = useState(toDateInputValue(now))
  const [dashUsername, setDashUsername] = useState('')
  const [dashGrade, setDashGrade] = useState('')
  const [dashOperation, setDashOperation] = useState('')
  const [dashDifficulty, setDashDifficulty] = useState('')
  const [dashSubject, setDashSubject] = useState('')
  const [dashSessions, setDashSessions] = useState<SessionRecord[]>([])
  const [dashUserMap, setDashUserMap] = useState<Record<string, string>>({})
  const [dashLoading, setDashLoading] = useState(false)
  const [dashError, setDashError] = useState('')
  const [dashLoaded, setDashLoaded] = useState(false)

  // Admins management (super admin only)
  const [adminList, setAdminList] = useState<AdminRecord[]>([])
  const [adminsLoading, setAdminsLoading] = useState(false)
  const [adminSearch, setAdminSearch] = useState('')
  const [adminCandidates, setAdminCandidates] = useState<UserProfile[]>([])
  const [adminSearchError, setAdminSearchError] = useState('')
  const [adminSearchLoading, setAdminSearchLoading] = useState(false)
  const [adminActionMsg, setAdminActionMsg] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    if (tab === 'audit') loadAudit()
    if (tab === 'dashboard' && !dashLoaded) loadDashboard()
    if (tab === 'admins') loadAdminList()
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

  async function loadDashboard() {
    setDashLoading(true)
    setDashError('')
    try {
      let resolvedUid: string | undefined
      if (dashUsername.trim()) {
        if (dashUsername.trim().length < 4) {
          setDashError('Enter at least 4 characters for username filter.')
          setDashLoading(false)
          return
        }
        const results = await searchUsersByPrefix(dashUsername.trim())
        if (results.length === 0) {
          setDashError(`No users found matching "${dashUsername.trim()}"`)
          setDashLoading(false)
          return
        }
        // If multiple matches, filter on all of them (no single uid filter)
        // If exactly one match, filter by that uid
        resolvedUid = results.length === 1 ? results[0]!.uid : undefined
      }

      const filters: DashboardFilters = {
        startMs: new Date(dashFromDate).getTime(),
        endMs: new Date(dashToDate).getTime() + 86399999, // end of day
        userId: resolvedUid,
        grade: dashGrade || undefined,
        operation: dashOperation || undefined,
        difficulty: dashDifficulty || undefined,
        subject: (dashSubject as 'mentalMaths' | 'socialStudies') || undefined,
      }

      const { sessions, userMap } = await getDashboardSessions(filters)
      setDashSessions(sessions)
      setDashUserMap(userMap)
      setDashLoaded(true)
    } catch (err) {
      setDashError('Failed to load sessions. Please try again.')
      console.error(err)
    } finally {
      setDashLoading(false)
    }
  }

  async function loadAdminList() {
    setAdminsLoading(true)
    try {
      setAdminList(await getAdminList())
    } finally {
      setAdminsLoading(false)
    }
  }

  async function handleAdminSearch() {
    const input = adminSearch.trim()
    if (input.length < 4) { setAdminSearchError('Enter at least 4 characters.'); return }
    setAdminSearchLoading(true)
    setAdminSearchError('')
    setAdminCandidates([])
    try {
      const results = await searchUsersByPrefix(input)
      // Exclude users already admins
      const existing = new Set(adminList.map((a) => a.uid))
      const filtered = results.filter((u) => !existing.has(u.uid))
      if (filtered.length === 0) setAdminSearchError('No eligible users found.')
      else setAdminCandidates(filtered)
    } finally {
      setAdminSearchLoading(false)
    }
  }

  async function handleAddAdmin(user: UserProfile) {
    setAdminCandidates([])
    setAdminSearch('')
    setAdminActionMsg(null)
    try {
      await addAdmin(user)
      setAdminActionMsg({ ok: true, msg: `@${user.username} added as admin.` })
      await loadAdminList()
    } catch {
      setAdminActionMsg({ ok: false, msg: 'Failed to add admin. Please try again.' })
    }
  }

  async function handleRemoveAdmin(record: AdminRecord) {
    setAdminActionMsg(null)
    try {
      await removeAdmin(record.uid)
      setAdminActionMsg({ ok: true, msg: `@${record.username} removed as admin.` })
      await loadAdminList()
    } catch {
      setAdminActionMsg({ ok: false, msg: 'Failed to remove admin. Please try again.' })
    }
  }

  async function handleSearchA() {
    const input = searchA.trim()
    if (!input) return
    if (input.length < 4) { setErrorA('Enter at least 4 characters to search.'); return }
    setLoadingA(true)
    setErrorA('')
    setUserA(null)
    setResultsA([])
    setAction(null)
    setResult(null)
    try {
      const results = await searchUsersByPrefix(input)
      if (results.length === 0) setErrorA(`No users found matching "${input}".`)
      else if (results.length === 1) setUserA(results[0]!)
      else setResultsA(results)
    } finally {
      setLoadingA(false)
    }
  }

  function selectUserA(user: UserProfile) {
    setUserA(user)
    setResultsA([])
  }

  async function handleSearchB() {
    const input = searchB.trim()
    if (!input) return
    if (input.length < 4) { setErrorB('Enter at least 4 characters to search.'); return }
    setLoadingB(true)
    setErrorB('')
    setUserB(null)
    setResultsB([])
    try {
      const results = await searchUsersByPrefix(input)
      if (results.length === 0) setErrorB(`No users found matching "${input}".`)
      else if (results.length === 1) {
        const found = results[0]!
        if (found.uid === userA?.uid) setErrorB('Cannot select the same user twice.')
        else setUserB(found)
      } else {
        setResultsB(results.filter((u) => u.uid !== userA?.uid))
      }
    } finally {
      setLoadingB(false)
    }
  }

  function selectUserB(user: UserProfile) {
    setUserB(user)
    setResultsB([])
  }

  function selectAction(a: Action) {
    setAction(a)
    setUserB(null)
    setResultsB([])
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
      } else if (action === 'delete_user') {
        const details = await adminDeleteUser(userA, profile, notes.trim())
        setResult({ ok: true, msg: details })
        setUserA(null)
        setAction(null)
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

  // Dashboard stats
  const uniqueUsers = new Set(dashSessions.map((s) => s.userId)).size
  const avgScore = dashSessions.length
    ? Math.round(dashSessions.reduce((sum, s) => sum + s.score, 0) / dashSessions.length)
    : 0
  const avgAccuracy = dashSessions.length
    ? Math.round(dashSessions.reduce((sum, s) => sum + s.accuracy, 0) / dashSessions.length)
    : 0

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
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['users', 'dashboard', 'audit', ...(isSuperAdmin ? ['admins'] : [])] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl font-medium text-sm cursor-pointer transition-colors min-w-fit ${
              tab === t
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white/70 text-gray-600 hover:bg-white'
            }`}
          >
            {t === 'users' ? '👤 Users' : t === 'dashboard' ? '📊 Dashboard' : t === 'audit' ? '📋 Audit' : '🔐 Admins'}
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
            {resultsA.length > 0 && (
              <UserPickerList
                users={resultsA}
                onSelect={selectUserA}
                label="Select User A"
              />
            )}
          </div>

          {/* User A card + action buttons */}
          {userA && (
            <div className="bg-white/90 rounded-2xl p-4 space-y-3 shadow-sm">
              <UserCard user={userA} label="User A" />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <ActionBtn label="Reset Password" icon="🔑" active={action === 'reset_password'} onClick={() => selectAction('reset_password')} />
                <ActionBtn label="Merge Users"    icon="🔀" active={action === 'merge'}          onClick={() => selectAction('merge')} />
                <ActionBtn label="Move Scores"    icon="📦" active={action === 'move'}           onClick={() => selectAction('move')} />
                {userA.uid !== profile?.uid && (
                  <ActionBtn label="Delete User" icon="🗑️" active={action === 'delete_user'} onClick={() => selectAction('delete_user')} danger />
                )}
              </div>
            </div>
          )}

          {/* Action panel */}
          {action && userA && (
            <div className="bg-white/90 rounded-2xl p-4 space-y-4 shadow-sm">
              <p className="font-semibold text-gray-700">
                {action === 'reset_password' && '🔑 Reset Password'}
                {action === 'merge'          && '🔀 Merge Users'}
                {action === 'move'           && '📦 Move Scores'}
                {action === 'delete_user'    && '🗑️ Delete User'}
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
              {action === 'delete_user' && (
                <p className="text-xs text-red-700 bg-red-50 p-3 rounded-xl leading-relaxed">
                  Permanently deletes <strong>@{userA.username}</strong>'s account, all sessions, high scores, and profile. This cannot be undone.
                </p>
              )}

              {/* Secondary user search */}
              {needsSecondUser && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">
                    {action === 'merge' ? 'Merge into — User B (keeps identity):' : 'Move scores to — User B:'}
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
                  {resultsB.length > 0 && (
                    <UserPickerList users={resultsB} onSelect={selectUserB} label="Select User B" />
                  )}
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
                        className="w-full px-3 py-2 pr-16 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                        className="w-full px-3 py-2 pr-16 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                className={`w-full py-3 font-bold rounded-xl disabled:opacity-40 cursor-pointer active:scale-95 transition-all ${
                  action === 'delete_user'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-primary hover:bg-primary-dark text-white'
                }`}
              >
                {executing ? 'Working…' : action === 'delete_user' ? 'Delete User' : 'Confirm Action'}
              </button>

              {/* Result */}
              {result && (
                <div className={`p-3 rounded-xl text-sm font-medium leading-relaxed ${result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {result.ok ? '✅ ' : '❌ '}
                  {result.msg}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── DASHBOARD TAB ────────────────────────────── */}
      {tab === 'dashboard' && (
        <div className="space-y-4">

          {/* Filters */}
          <div className="bg-white/90 rounded-2xl p-4 space-y-3 shadow-sm">
            <p className="text-sm font-semibold text-gray-600">Filters</p>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">From</label>
                <input
                  type="date"
                  value={dashFromDate}
                  onChange={(e) => setDashFromDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">To</label>
                <input
                  type="date"
                  value={dashToDate}
                  onChange={(e) => setDashToDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Username */}
            <input
              type="text"
              value={dashUsername}
              onChange={(e) => setDashUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadDashboard()}
              placeholder="Username (optional)"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            {/* Grade / Operation / Difficulty */}
            <div className="grid grid-cols-3 gap-2">
              <select
                value={dashGrade}
                onChange={(e) => setDashGrade(e.target.value)}
                className="px-2 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              >
                <option value="">All grades</option>
                {GRADE_OPTIONS.map((g) => <option key={g} value={g}>Grade {g}</option>)}
              </select>
              <select
                value={dashOperation}
                onChange={(e) => setDashOperation(e.target.value)}
                className="px-2 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              >
                <option value="">All ops</option>
                {OPERATION_OPTIONS.map((o) => (
                  <option key={o} value={o}>{OPERATION_LABELS[o].split(' ')[1] ?? o}</option>
                ))}
              </select>
              <select
                value={dashDifficulty}
                onChange={(e) => setDashDifficulty(e.target.value)}
                className="px-2 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              >
                <option value="">All levels</option>
                {DIFFICULTY_OPTIONS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
              <select
                value={dashSubject}
                onChange={(e) => setDashSubject(e.target.value)}
                className="px-2 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              >
                <option value="">All subjects</option>
                <option value="mentalMaths">Mental Maths</option>
                <option value="socialStudies">Social Studies</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setDashLoaded(false); loadDashboard() }}
                disabled={dashLoading}
                className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50 cursor-pointer"
              >
                {dashLoading ? 'Loading…' : 'Apply Filters'}
              </button>
              <button
                onClick={() => {
                  setDashUsername('')
                  setDashGrade('')
                  setDashOperation('')
                  setDashDifficulty('')
                  setDashFromDate(toDateInputValue(Date.now() - 60 * 24 * 60 * 60 * 1000))
                  setDashToDate(toDateInputValue(Date.now()))
                  setDashLoaded(false)
                }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium cursor-pointer hover:bg-gray-200"
              >
                Reset
              </button>
            </div>
            {dashError && <p className="text-red-500 text-sm">{dashError}</p>}
          </div>

          {/* Stats summary */}
          {dashLoaded && !dashLoading && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Sessions', value: dashSessions.length },
                { label: 'Users', value: uniqueUsers },
                { label: 'Avg Score', value: avgScore },
                { label: 'Avg Acc', value: `${avgAccuracy}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/90 rounded-2xl p-3 text-center shadow-sm">
                  <p className="text-lg font-bold text-primary-dark">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Session list */}
          {dashLoading && <p className="text-center text-gray-400 py-10">Loading…</p>}
          {dashLoaded && !dashLoading && dashSessions.length === 0 && (
            <p className="text-center text-gray-400 py-10">No sessions found for the selected filters.</p>
          )}
          {dashLoaded && !dashLoading && dashSessions.length > 0 && (
            <div className="space-y-2">
              {dashSessions.map((s) => (
                <SessionRow key={s.id} session={s} username={dashUserMap[s.userId] ?? s.userId} />
              ))}
              {dashSessions.length === 500 && (
                <p className="text-xs text-center text-gray-400 pt-1">Showing first 500 results. Narrow filters to see more.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ADMINS TAB (super admin only) ─────────────── */}
      {tab === 'admins' && isSuperAdmin && (
        <div className="space-y-4">

          {/* Add admin */}
          <div className="bg-white/90 rounded-2xl p-4 space-y-3 shadow-sm">
            <p className="text-sm font-semibold text-gray-600">Add Admin</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminSearch()}
                placeholder="Search by username (4+ chars)"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={handleAdminSearch}
                disabled={adminSearchLoading || adminSearch.trim().length < 4}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50 cursor-pointer"
              >
                {adminSearchLoading ? '…' : 'Search'}
              </button>
            </div>
            {adminSearchError && <p className="text-red-500 text-sm">{adminSearchError}</p>}
            {adminCandidates.length > 0 && (
              <UserPickerList
                users={adminCandidates}
                onSelect={handleAddAdmin}
                label="Select user to make admin"
              />
            )}
            {adminActionMsg && (
              <p className={`text-sm font-medium ${adminActionMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                {adminActionMsg.ok ? '✅ ' : '❌ '}{adminActionMsg.msg}
              </p>
            )}
          </div>

          {/* Admin list */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-600 px-1">
              {adminsLoading ? 'Loading…' : `${adminList.length} admin${adminList.length !== 1 ? 's' : ''}`}
            </p>
            {adminList.map((a) => (
              <div key={a.uid} className="bg-white/90 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
                <div className="flex-1">
                  <span className="font-semibold text-gray-800">@{a.username}</span>
                  <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    a.role === 'super' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {a.role === 'super' ? '⭐ Super Admin' : 'Admin'}
                  </span>
                </div>
                {a.role !== 'super' && (
                  <button
                    onClick={() => handleRemoveAdmin(a)}
                    className="text-sm text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AUDIT LOG TAB ──────────────────────────────── */}
      {tab === 'audit' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-700">Recent Actions</p>
            <button onClick={loadAudit} className="text-sm text-primary cursor-pointer hover:underline">
              Refresh
            </button>
          </div>

          {auditLoading && <p className="text-center text-gray-400 py-10">Loading…</p>}
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

function UserPickerList({
  users, onSelect, label,
}: { users: UserProfile[]; onSelect: (u: UserProfile) => void; label: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500 font-medium">{label} — tap to select:</p>
      {users.map((u) => (
        <button
          key={u.uid}
          onClick={() => onSelect(u)}
          className="w-full flex items-center gap-3 bg-gray-50 hover:bg-primary/10 rounded-xl px-3 py-2 text-left transition-colors cursor-pointer"
        >
          <span className="text-xl">{u.avatar}</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">@{u.username}</p>
            <p className="text-xs text-gray-500">{u.name} · Grade {u.grade}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

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
  label, icon, active, onClick, danger,
}: {
  label: string; icon: string; active: boolean; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
        active
          ? danger ? 'bg-red-600 text-white shadow-sm' : 'bg-primary text-white shadow-sm'
          : danger ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  )
}

const OP_SHORT: Record<string, string> = {
  addition: '+', subtraction: '−', multiplication: '×', division: '÷',
  percentage: '%', squareRoot: '√', power: '^', mix: '🎲',
}

function SessionRow({ session, username }: { session: SessionRecord; username: string }) {
  const date = new Date(session.timestamp)
  const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`

  const isSS = session.subject === 'socialStudies'

  return (
    <div className="bg-white/90 rounded-xl px-3 py-2 shadow-sm flex items-center gap-2 text-sm flex-wrap">
      <span className="text-gray-400 text-xs w-24 shrink-0">{dateStr}</span>
      <span className="text-primary font-medium shrink-0">@{username}</span>
      <span className="text-gray-500 shrink-0">G{session.grade}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${isSS ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
        {isSS ? '🌍 SS' : '🧮 MM'}
      </span>
      {!isSS && session.operation && (
        <span className="font-mono text-gray-700 shrink-0">{OP_SHORT[session.operation] ?? session.operation}</span>
      )}
      {!isSS && session.difficulty && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
          session.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
          session.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>{session.difficulty}</span>
      )}
      <span className="ml-auto font-bold text-gray-800 shrink-0">{session.score}pts</span>
      <span className="text-gray-500 shrink-0">{session.accuracy}%</span>
    </div>
  )
}

const ACTION_LABELS: Record<string, string> = {
  password_reset: '🔑 Password Reset',
  merge_users: '🔀 Merge Users',
  move_scores: '📦 Move Scores',
  delete_user: '🗑️ Delete User',
}

function AuditCard({ entry }: { entry: AuditEntry }) {
  const date = new Date(entry.timestamp).toLocaleString()

  return (
    <div className="bg-white/90 rounded-2xl p-4 space-y-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${entry.outcome === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {entry.outcome === 'success' ? '✓ Success' : '✗ Failed'}
        </span>
        <span className="text-xs text-gray-400 shrink-0">{date}</span>
      </div>

      <p className="font-semibold text-gray-800">{ACTION_LABELS[entry.action] ?? entry.action}</p>

      <p className="text-xs text-gray-500">
        By <strong>@{entry.adminUsername}</strong>
        {' · '}
        {entry.affectedUsers.map((u) => `@${u.username}`).join(' → ')}
      </p>

      <p className="text-sm text-gray-700">{entry.details}</p>

      {entry.notes && (
        <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-2">"{entry.notes}"</p>
      )}

      {entry.supportingFileUrl && (
        <a href={entry.supportingFileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline pt-1">
          📎 {entry.supportingFileName ?? 'Supporting document'}
        </a>
      )}
    </div>
  )
}
