interface NumberPadProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export function NumberPad({ value, onChange, onSubmit }: NumberPadProps) {
  function handleKey(key: string) {
    if (key === 'backspace') {
      onChange(value.slice(0, -1))
    } else if (key === 'submit') {
      onSubmit()
    } else if (key === '-') {
      // Toggle negative
      if (value.startsWith('-')) {
        onChange(value.slice(1))
      } else {
        onChange('-' + value)
      }
    } else {
      // Limit to reasonable length
      if (value.replace('-', '').length < 6) {
        onChange(value + key)
      }
    }
  }

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['-', '0', 'backspace'],
  ]

  return (
    <div className="space-y-2">
      {/* Display */}
      <div className="text-center text-4xl font-bold text-primary-dark bg-white/80 rounded-2xl py-4 min-h-[60px]">
        {value || '\u00A0'}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {keys.flat().map((key) => (
          <button
            key={key}
            onClick={() => handleKey(key)}
            className="py-4 text-2xl font-bold rounded-2xl bg-white/90 text-gray-800 hover:bg-white active:scale-95 active:bg-gray-100 transition-all shadow-sm cursor-pointer"
          >
            {key === 'backspace' ? '⌫' : key}
          </button>
        ))}
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!value || value === '-'}
        className="w-full py-4 text-xl font-bold rounded-2xl bg-success text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-md disabled:opacity-40 cursor-pointer"
      >
        Submit
      </button>
    </div>
  )
}
