import { useSettings } from '../../context/SettingsContext'

export function SettingsScreen() {
  const { soundEnabled, setSoundEnabled } = useSettings()

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-primary-dark">Settings</h2>

      <div className="bg-white/90 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">Sound Effects</p>
            <p className="text-sm text-gray-500">Play sounds for correct/wrong answers</p>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-12 h-7 rounded-full transition-colors cursor-pointer ${
              soundEnabled ? 'bg-success' : 'bg-gray-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform mx-1 ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="bg-white/90 rounded-3xl p-6">
        <p className="text-sm text-gray-500 text-center">
          Mental Maths v0.1.0
        </p>
      </div>
    </div>
  )
}
