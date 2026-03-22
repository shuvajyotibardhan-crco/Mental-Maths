/** Mask an email: "shuvajyoti@gmail.com" → "s***@gmail.com" */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***'
  return `${local[0]}***@${domain}`
}

/** SHA-256 hash of the email (lowercase, trimmed) */
export async function hashEmail(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase()
  const data = new TextEncoder().encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
