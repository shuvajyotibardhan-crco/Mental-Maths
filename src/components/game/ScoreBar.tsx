interface ScoreBarProps {
  score: number
  streak: number
  questionNumber: number
  totalQuestions?: number // for fixed mode
}

export function ScoreBar({ score, streak, questionNumber, totalQuestions }: ScoreBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white/70 rounded-2xl">
      <div className="flex items-center gap-1">
        <span className="text-warning font-bold text-lg">⭐ {score}</span>
      </div>

      {streak >= 3 && (
        <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 rounded-full">
          <span>🔥</span>
          <span className="font-bold text-orange-600">{streak}</span>
        </div>
      )}

      <div className="text-sm text-gray-500 font-medium">
        Q{questionNumber}{totalQuestions ? ` / ${totalQuestions}` : ''}
      </div>
    </div>
  )
}
