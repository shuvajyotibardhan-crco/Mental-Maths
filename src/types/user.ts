import type { Grade } from './question'

export interface UserProfile {
  uid: string
  username: string
  name: string
  grade: Grade
  avatar: string
  email?: string
  createdAt: number
}
