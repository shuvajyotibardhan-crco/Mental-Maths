import type { Grade } from './question'

export interface UserProfile {
  uid: string
  username: string
  name: string
  grade: Grade
  avatar: string
  emailMasked?: string
  emailHash?: string
  createdAt: number
}
