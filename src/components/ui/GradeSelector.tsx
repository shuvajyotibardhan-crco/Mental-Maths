import { GRADE_OPTIONS } from '../../constants/gradeConfig'
import type { Grade } from '../../types/question'

interface GradeSelectorProps {
  value: Grade
  onChange: (grade: Grade) => void
  /** Restrict available grades to a subset (e.g. SS only allows 3-12). */
  allowedGrades?: Grade[]
  /** Accent colour class for selected state (default: bg-primary text-white). */
  selectedClass?: string
}

const DEFAULT_SELECTED = 'bg-primary text-white shadow-md'

export function GradeSelector({
  value,
  onChange,
  allowedGrades,
  selectedClass = DEFAULT_SELECTED,
}: GradeSelectorProps) {
  const options = allowedGrades
    ? GRADE_OPTIONS.filter((o) => allowedGrades.includes(o.value))
    : GRADE_OPTIONS

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            value === opt.value
              ? selectedClass
              : 'bg-white/80 text-gray-700 hover:bg-white'
          }`}
        >
          {opt.value === 'KG' ? 'KG' : `Gr ${opt.value}`}
        </button>
      ))}
    </div>
  )
}
