import { useState } from 'react'
import emailjs from '@emailjs/browser'
import { useAuth } from '../../context/AuthContext'

interface ContactScreenProps {
  onNavigate: (screen: string) => void
}

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string

const MAX_WORDS = 500

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

export function ContactScreen({ onNavigate }: ContactScreenProps) {
  const { profile } = useAuth()
  const isLoggedOut = !profile

  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [usernameInput, setUsernameInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const wordCount = countWords(description)
  const wordLimitReached = wordCount >= MAX_WORDS

  function handleDescriptionChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    const words = countWords(value)
    if (words <= MAX_WORDS) {
      setDescription(value)
    } else {
      const trimmed = value.trim().split(/\s+/).slice(0, MAX_WORDS).join(' ')
      setDescription(trimmed)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    if (isLoggedOut && !usernameInput.trim()) { setErrorMsg('Please enter your username.'); return }
    if (!subject.trim()) { setErrorMsg('Please enter a subject.'); return }
    if (!description.trim()) { setErrorMsg('Please describe the problem.'); return }
    if (!contactEmail.trim()) { setErrorMsg('Please enter your contact email.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setErrorMsg('Please enter a valid email address.')
      return
    }

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      setErrorMsg('Email service is not configured. Please contact the administrator directly.')
      return
    }

    setStatus('sending')

    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
        subject: `${subject.trim()} | DIVEL EDU QUIZ`,
        description: description.trim(),
        contact_email: contactEmail.trim(),
        from_name: profile?.name ?? 'App User',
        username: profile?.username ?? (usernameInput.trim() || 'unknown'),
      }, PUBLIC_KEY)
      setStatus('success')
    } catch (err) {
      console.error('EmailJS error:', err)
      setStatus('error')
      setErrorMsg('Failed to send your message. Please try again or email us directly at app_admin@divel.me.')
    }
  }

  if (status === 'success') {
    return (
      <div className="p-4 max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold text-primary-dark text-center">Message Sent!</h2>
        <p className="text-gray-600 text-center">
          We've received your message and will get back to you at{' '}
          <span className="font-medium">{contactEmail}</span>.
        </p>
        <button
          onClick={() => onNavigate(isLoggedOut ? 'login' : 'settings')}
          className="mt-4 bg-primary text-white font-semibold rounded-2xl px-8 py-3 hover:bg-primary/90 transition-colors cursor-pointer"
        >
          {isLoggedOut ? 'Back to Login' : 'Back to Settings'}
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate(isLoggedOut ? 'login' : 'settings')}
          className="text-gray-500 hover:text-gray-700 text-xl cursor-pointer"
          aria-label="Back"
        >
          ←
        </button>
        <h2 className="text-2xl font-bold text-primary-dark">Contact Support</h2>
      </div>

      <p className="text-sm text-gray-500">
        Having a problem or want to give feedback? We'd love to hear from you.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username (logged-out only) */}
        {isLoggedOut && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Your username <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Your app username"
              className="w-full rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}

        {/* Subject */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description of your issue"
            maxLength={120}
            className="w-full rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <span className={`text-xs ${wordLimitReached ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
              {wordCount} / {MAX_WORDS} words
            </span>
          </div>
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Please describe the problem or feedback in detail..."
            rows={6}
            className="w-full rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* Contact Email */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Your email address</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="we'll reply here"
            className="w-full rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-sm text-orange-700">
            {errorMsg}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full bg-primary text-white font-semibold rounded-3xl py-4 hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {status === 'sending' ? 'Sending…' : 'Send Message'}
        </button>
      </form>
    </div>
  )
}
