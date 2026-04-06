import { useState, useRef } from 'react'
import emailjs from '@emailjs/browser'
import { useAuth } from '../../context/AuthContext'

interface ContactScreenProps {
  onNavigate: (screen: string) => void
}

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string

const MAX_WORDS = 500
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]
const MAX_FILE_SIZE_MB = 5

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ContactScreen({ onNavigate }: ContactScreenProps) {
  const { profile } = useAuth()

  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const wordCount = countWords(description)
  const wordLimitReached = wordCount >= MAX_WORDS

  function handleDescriptionChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    const words = countWords(value)
    if (words <= MAX_WORDS) {
      setDescription(value)
    } else {
      // Trim to MAX_WORDS words
      const trimmed = value.trim().split(/\s+/).slice(0, MAX_WORDS).join(' ')
      setDescription(trimmed)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const valid: File[] = []
    const errors: string[] = []

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: unsupported file type`)
        continue
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        errors.push(`${file.name}: exceeds ${MAX_FILE_SIZE_MB}MB limit`)
        continue
      }
      valid.push(file)
    }

    if (errors.length > 0) {
      setErrorMsg(errors.join(', '))
    }

    setAttachments((prev) => {
      const names = new Set(prev.map((f) => f.name))
      return [...prev, ...valid.filter((f) => !names.has(f.name))]
    })

    // Reset input so same file can be re-selected after removal
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

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
      // Convert attachments to base64
      const attachmentData = await Promise.all(
        attachments.map(async (file) => ({
          name: file.name,
          data: await fileToBase64(file),
          type: file.type,
        }))
      )

      const templateParams: Record<string, string> = {
        subject: `${subject.trim()} | Mental Maths`,
        description: description.trim(),
        contact_email: contactEmail.trim(),
        from_name: profile?.displayName ?? 'App User',
        username: profile?.username ?? 'unknown',
        attachments_summary:
          attachmentData.length > 0
            ? attachmentData.map((a) => a.name).join(', ')
            : 'None',
      }

      // EmailJS supports one attachment via attachment_name + attachment (base64)
      // For multiple files we include them as text summary; first file sent as attachment
      if (attachmentData.length > 0) {
        templateParams.attachment_name = attachmentData[0].name
        templateParams.attachment = attachmentData[0].data
      }

      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
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
          onClick={() => onNavigate('settings')}
          className="mt-4 bg-primary text-white font-semibold rounded-2xl px-8 py-3 hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Back to Settings
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('settings')}
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

        {/* Attachments */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Attachments (optional)</label>
          <p className="text-xs text-gray-400">
            Images (JPG, PNG, GIF, WebP) or documents (PDF, Word, TXT) — max {MAX_FILE_SIZE_MB}MB each
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-white/60 px-4 py-3 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors cursor-pointer w-full justify-center"
          >
            <span className="text-lg">📎</span>
            Add file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {attachments.length > 0 && (
            <ul className="space-y-1">
              {attachments.map((file, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between bg-white/80 rounded-xl px-3 py-2 text-sm"
                >
                  <span className="truncate text-gray-700 flex-1 mr-2">
                    {file.type.startsWith('image/') ? '🖼️ ' : '📄 '}
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-400 mr-2 shrink-0">
                    {(file.size / 1024).toFixed(0)}KB
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
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
