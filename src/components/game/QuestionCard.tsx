import type { Question } from '../../types'

interface QuestionCardProps {
  question: Question
  feedback: 'correct' | 'wrong' | null
}

export function QuestionCard({ question, feedback }: QuestionCardProps) {
  let cardClass = 'bg-white/90 shadow-lg'
  if (feedback === 'correct') cardClass = 'bg-emerald-50 shadow-lg animate-bounce-in'
  if (feedback === 'wrong') cardClass = 'bg-orange-50 shadow-lg animate-shake'

  return (
    <div className={`rounded-3xl p-8 text-center transition-all ${cardClass}`}>
      <p className="text-5xl md:text-6xl font-bold text-gray-800 animate-slide-in">
        {question.displayString}
      </p>
      {feedback === 'correct' && (
        <p className="mt-4 text-xl font-semibold text-emerald-600 animate-bounce-in">
          Great job!
        </p>
      )}
      {feedback === 'wrong' && (
        <p className="mt-4 text-xl font-semibold text-orange-500 animate-bounce-in">
          Almost! The answer was {question.correctAnswer}
        </p>
      )}
    </div>
  )
}
