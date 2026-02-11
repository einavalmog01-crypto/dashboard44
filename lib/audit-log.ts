export type AuditAction =
  | "ENV_SELECTED"
  | "ENV_VALIDATED"
  | "RUN_STARTED"
  | "RUN_COMPLETED"
  | "RUN_FAILED"
export interface AuditEvent {
  id: string
  env: string
  action: AuditAction
  timestamp: number
  userId: string
  dryRun: boolean
  success?: boolean
  details?: string
}
const AUDIT_KEY = "audit-log"
export function logAudit(event: Omit<AuditEvent, "id" | "timestamp">) {
  if (typeof window === "undefined") return
const existing = loadAuditLogs()
  const record: AuditEvent = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  }
localStorage.setItem(AUDIT_KEY, JSON.stringify([...existing, record]))
}
export function loadAuditLogs(): AuditEvent[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(AUDIT_KEY)
  return raw ? JSON.parse(raw) : []
}
