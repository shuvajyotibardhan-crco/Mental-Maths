export type AdminActionType = 'password_reset' | 'merge_users' | 'move_scores' | 'delete_user'

export interface AuditEntry {
  id: string
  timestamp: number
  adminUid: string
  adminUsername: string
  action: AdminActionType
  affectedUsers: Array<{ uid: string; username: string }>
  notes: string
  supportingFileUrl?: string
  supportingFileName?: string
  outcome: 'success' | 'failed'
  details: string
}
