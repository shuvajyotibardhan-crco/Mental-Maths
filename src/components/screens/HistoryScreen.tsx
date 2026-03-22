import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getSessions } from '../../firebase/firestore'
import { OPERATION_LABELS, GRADE_OPTIONS } from '../../constants/gradeConfig'
import type { SessionRecord, Grade, OperationType } from '../../types'

type DateFilter = 'all' | 'today' | '7days' | '30days'

export function HistoryScreen() {
  const { profile } = useAuth()
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [gradeFilter, setGradeFilter] = useState<Grade | ''>('')
  const [operationFilter, setOperationFilter] = useState<OperationType | ''>('')

  useEffect(() => {
    if (!profile) return

    async function load() {
      setLoading(true)
      let startDate: Date | undefined
      const now = new Date()

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }

      const results = await getSessions({
        userId: profile!.uid,
        startDate,
        grade: gradeFilter || undefined,
        operation: operationFilter || undefined,
      })
      setSessions(results)
      setLoading(false)
    }

    load().catch(console.error)
  }, [profile, dateFilter, gradeFilter, operationFilter])

  const totalGames = sessions.length
  const avgAccuracy = totalGames > 0
    ? Math.round(sessions.reduce((s, r) => s + r.accuracy, 0) / totalGames)
    : 0

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-primary-dark">History</h2>

      {/* Summary */}
      <div className="flex gap-3">
        <div className="flex-1 bg-white/80 rounded-2xl p-3 text-center">
          <p className="text-xs text-gray-500">Games</p>
          <p className="text-xl font-bold text-primary-dark">{totalGames}</p>
        </div>
        <div className="flex-1 bg-white/80 rounded-2xl p-3 text-center">
          <p className="text-xs text-gray-500">Avg Accuracy</p>
          <p className="text-xl font-bold text-emerald-600">{avgAccuracy}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {/* Date filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {([['all', 'All'], ['today', 'Today'], ['7days', '7 Days'], ['30days', '30 Days']] as const).map(
            ([val, label]) => (
              <button
                key={val}
                onClick={() => setDateFilter(val)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  dateFilter === val ? 'bg-primary text-white' : 'bg-white/80 text-gray-600'
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>

        {/* Grade & Operation filters */}
        <div className="flex gap-2">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value as Grade | '')}
            className="flex-1 px-3 py-2 rounded-xl bg-white/80 text-sm border-0 outline-none cursor-pointer"
          >
            <option value="">All Grades</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>

          <select
            value={operationFilter}
            onChange={(e) => setOperationFilter(e.target.value as OperationType | '')}
            className="flex-1 px-3 py-2 rounded-xl bg-white/80 text-sm border-0 outline-none cursor-pointer"
          >
            <option value="">All Operations</option>
            {Object.entries(OPERATION_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Session List */}
      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : sessions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No games found. Start playing!</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-white/80 rounded-2xl p-4 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">
                    {OPERATION_LABELS[s.operation]}
                  </span>
                  {s.isHighScore && <span className="text-sm">🏆</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {s.difficulty} • {s.mode === 'timed' ? '2 min' : '20 Qs'} • Grade {s.grade}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(s.timestamp).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">⭐ {s.score}</p>
                <p className="text-xs text-gray-500">
                  {s.correctAnswers}/{s.totalQuestions} ({s.accuracy}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
