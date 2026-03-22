import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTimerOptions {
  mode: 'countdown' | 'elapsed'
  durationSeconds?: number // required for countdown
  onComplete?: () => void
}

export function useTimer({ mode, durationSeconds = 120, onComplete }: UseTimerOptions) {
  const [seconds, setSeconds] = useState(mode === 'countdown' ? durationSeconds : 0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const start = useCallback(() => {
    setIsRunning(true)
    setSeconds(mode === 'countdown' ? durationSeconds : 0)
  }, [mode, durationSeconds])

  const stop = useCallback(() => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    stop()
    setSeconds(mode === 'countdown' ? durationSeconds : 0)
  }, [mode, durationSeconds, stop])

  useEffect(() => {
    if (!isRunning) return

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (mode === 'countdown') {
          const next = prev - 1
          if (next <= 0) {
            onCompleteRef.current?.()
            return 0
          }
          return next
        }
        return prev + 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, mode])

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  const display = `${minutes}:${secs.toString().padStart(2, '0')}`
  const progress = mode === 'countdown' ? seconds / durationSeconds : 0

  return { seconds, display, progress, isRunning, start, stop, reset }
}
