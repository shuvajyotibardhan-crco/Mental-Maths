import { useCallback } from 'react'
import { useSettings } from '../context/SettingsContext'

export type SoundType = 'wrong' | 'complete' | 'personalBest' | 'globalBest'

function getAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  } catch {
    return null
  }
}

function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.25,
) {
  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()
  osc.connect(gainNode)
  gainNode.connect(ctx.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  gainNode.gain.setValueAtTime(gain, start)
  gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.start(start)
  osc.stop(start + duration)
}

export function useSound() {
  const { soundEnabled } = useSettings()

  const play = useCallback(
    (sound: SoundType) => {
      if (!soundEnabled) return
      const ctx = getAudioContext()
      if (!ctx) return

      const t = ctx.currentTime

      switch (sound) {
        case 'wrong':
          // Descending buzz — two low square tones
          tone(ctx, 280, t, 0.14, 'square', 0.22)
          tone(ctx, 180, t + 0.14, 0.22, 'square', 0.22)
          break

        case 'complete':
          // Short ascending ding: C5 → E5 → G5
          tone(ctx, 523, t, 0.12, 'sine', 0.28)
          tone(ctx, 659, t + 0.13, 0.12, 'sine', 0.28)
          tone(ctx, 784, t + 0.26, 0.28, 'sine', 0.28)
          break

        case 'personalBest':
          // Fanfare: C5 → E5 → G5 → C6
          tone(ctx, 523, t, 0.1, 'triangle', 0.3)
          tone(ctx, 659, t + 0.11, 0.1, 'triangle', 0.3)
          tone(ctx, 784, t + 0.22, 0.1, 'triangle', 0.3)
          tone(ctx, 1047, t + 0.33, 0.45, 'triangle', 0.3)
          break

        case 'globalBest':
          // Grand fanfare: C5 → E5 → G5 → C6 → E6
          tone(ctx, 523, t, 0.09, 'triangle', 0.32)
          tone(ctx, 659, t + 0.10, 0.09, 'triangle', 0.32)
          tone(ctx, 784, t + 0.20, 0.09, 'triangle', 0.32)
          tone(ctx, 1047, t + 0.30, 0.12, 'triangle', 0.32)
          tone(ctx, 1319, t + 0.43, 0.55, 'triangle', 0.32)
          break
      }

      setTimeout(() => ctx.close(), 1800)
    },
    [soundEnabled],
  )

  return { play }
}
