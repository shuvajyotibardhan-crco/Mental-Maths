// Alphabet excludes ambiguous characters: 0/O, 1/I/L
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateGameCode(): string {
  let code = ''
  for (let i = 0; i < 7; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}
