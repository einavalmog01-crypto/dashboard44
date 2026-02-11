export interface SanityTestResult {
  testName?: string
  name?: string
  status: "PASS" | "FAILED"
  error?: string
  comment?: string
}

export interface SanityReport {
  id: string
  type: "BASIC" | "FULL" | "SELECTED" | "SCHEDULED"
  environment?: string
  tests: SanityTestResult[]
  createdAt: string
}

const STORAGE_KEY = "sanityReports"

export function getReports(): SanityReport[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const reports: SanityReport[] = JSON.parse(raw)
      // Sort by newest first
      return reports.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }
  } catch {
    // ignore
  }
  return []
}

export function getReportById(id: string): SanityReport | undefined {
  const reports = getReports()
  return reports.find((r) => r.id === id)
}

export function saveReport(report: SanityReport): void {
  if (typeof window === "undefined") return
  const existing = getReports()
  existing.push(report)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}
