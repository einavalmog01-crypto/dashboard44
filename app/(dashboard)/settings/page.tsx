"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { EnvironmentSettings } from "@/components/environment-settings"
import { useEnvironment } from "@/lib/environment-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Save, CheckCircle2, Globe, KeyRound, FolderKanban, Hash } from "lucide-react"
import { type JiraConfig, defaultJiraConfig, loadJiraConfig, saveJiraConfig, isJiraConfigured } from "@/lib/jira-config"

export default function SettingsPage() {
  const router = useRouter()
  const { environments, setEnvironments } = useEnvironment()
  const [envOpen, setEnvOpen] = useState(false)

  // Jira config state
  const [jiraConfig, setJiraConfig] = useState<JiraConfig>(defaultJiraConfig)
  const [showToken, setShowToken] = useState(false)
  const [jiraSaved, setJiraSaved] = useState(false)

  useEffect(() => {
    setJiraConfig(loadJiraConfig())
  }, [])

  const handleJiraSave = () => {
    const updated = { ...jiraConfig, isConfigured: isJiraConfigured(jiraConfig) }
    saveJiraConfig(updated)
    setJiraConfig(updated)
    setJiraSaved(true)
    setTimeout(() => setJiraSaved(false), 2000)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      {/* Environment Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Environment Connections</CardTitle>
              <CardDescription className="text-xs">
                Configure DB, Auth, Endpoint, and UNIX for each environment (CRs, SST, DEV3ST, etc.)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {environments.filter(e => e.isConfigured).length} / {environments.length} configured
              </Badge>
              <Button size="sm" onClick={() => setEnvOpen(true)}>
                Configure
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {envOpen && (
        <EnvironmentSettings
          isOpen={envOpen}
          onClose={() => setEnvOpen(false)}
          environments={environments}
          onSave={(updated) => {
            setEnvironments(updated)
            setEnvOpen(false)
          }}
        />
      )}

      {/* Jira Integration Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Jira Integration</CardTitle>
                <CardDescription className="text-xs">
                  Connect to your Jira board to sync the Progress Calculation kanban
                </CardDescription>
              </div>
            </div>
            {jiraConfig.isConfigured && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-muted-foreground" />
                Jira Base URL
              </Label>
              <Input
                placeholder="e.g., https://deljira"
                value={jiraConfig.baseUrl}
                onChange={(e) => setJiraConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <KeyRound className="h-3 w-3 text-muted-foreground" />
                Email / Username
              </Label>
              <Input
                placeholder="your.email@company.com"
                value={jiraConfig.email}
                onChange={(e) => setJiraConfig(prev => ({ ...prev, email: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <KeyRound className="h-3 w-3 text-muted-foreground" />
              API Token / Password
            </Label>
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                placeholder="Enter your Jira API token or password"
                value={jiraConfig.apiToken}
                onChange={(e) => setJiraConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                className="text-sm pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <FolderKanban className="h-3 w-3 text-muted-foreground" />
                Project Key
              </Label>
              <Input
                placeholder="e.g., VFDE"
                value={jiraConfig.projectKey}
                onChange={(e) => setJiraConfig(prev => ({ ...prev, projectKey: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Hash className="h-3 w-3 text-muted-foreground" />
                Board ID (rapidView)
              </Label>
              <Input
                placeholder="e.g., 4033"
                value={jiraConfig.boardId}
                onChange={(e) => setJiraConfig(prev => ({ ...prev, boardId: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleJiraSave} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {jiraSaved ? "Saved!" : "Save Jira Settings"}
            </Button>
            {jiraSaved && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Configuration saved
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
