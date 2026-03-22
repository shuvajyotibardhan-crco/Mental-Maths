interface TimerProps {
  display: string
  progress: number // 0-1 for countdown
  mode: 'countdown' | 'elapsed'
}

export function Timer({ display, progress, mode }: TimerProps) {
  const isLow = mode === 'countdown' && progress < 0.15

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-lg ${
      isLow ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white/80 text-gray-700'
    }`}>
      <span>⏱️</span>
      <span className="tabular-nums">{display}</span>
    </div>
  )
}
