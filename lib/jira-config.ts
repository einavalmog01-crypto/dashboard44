const JIRA_STORAGE_KEY = "jiraConfig"

export interface JiraConfig {
  baseUrl: string
  email: string
  apiToken: string
  projectKey: string
  boardId: string
  isConfigured: boolean
}

export const defaultJiraConfig: JiraConfig = {
  baseUrl: "",
  email: "",
  apiToken: "",
  projectKey: "",
  boardId: "",
  isConfigured: false,
}

export function loadJiraConfig(): JiraConfig {
  if (typeof window === "undefined") return defaultJiraConfig
  try {
    const stored = localStorage.getItem(JIRA_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...defaultJiraConfig, ...parsed }
    }
  } catch {
    // ignore
  }
  return defaultJiraConfig
}

export function saveJiraConfig(config: JiraConfig): void {
  if (typeof window === "undefined") return
  localStorage.setItem(JIRA_STORAGE_KEY, JSON.stringify(config))
}

export function isJiraConfigured(config: JiraConfig): boolean {
  return !!(
    config.baseUrl.trim() &&
    config.email.trim() &&
    config.apiToken.trim() &&
    config.projectKey.trim() &&
    config.boardId.trim()
  )
}
