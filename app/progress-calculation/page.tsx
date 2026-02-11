"use client"

import { useEffect, useState, useCallback, DragEvent } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Loader2, CloudOff, Cloud, Settings, AlertTriangle } from "lucide-react"
import { UserStory, Status, KANBAN_COLUMNS, STATUS_COLORS, StoryModal } from "./modal-helpers"
import { loadJiraConfig, isJiraConfigured, type JiraConfig } from "@/lib/jira-config"

export default function ProgressCalculationPage() {
  const [stories, setStories] = useState<UserStory[]>([])
  const [search, setSearch] = useState("")
  const [filterAssignee, setFilterAssignee] = useState("")
  const [editingStory, setEditingStory] = useState<UserStory | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [draggedStoryId, setDraggedStoryId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null)

  // Jira sync state
  const [jiraConfig, setJiraConfig] = useState<JiraConfig | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    const config = loadJiraConfig()
    setJiraConfig(config)
    const saved = localStorage.getItem("progressStories")
    if (saved) setStories(JSON.parse(saved))
    const syncTime = localStorage.getItem("progressLastSynced")
    if (syncTime) setLastSynced(syncTime)
  }, [])

  const syncFromJira = useCallback(async () => {
    if (!jiraConfig || !isJiraConfigured(jiraConfig)) return

    setIsSyncing(true)
    setSyncError(null)

    try {
      const res = await fetch("/api/jira/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: jiraConfig.baseUrl,
          email: jiraConfig.email,
          apiToken: jiraConfig.apiToken,
          projectKey: jiraConfig.projectKey,
          boardId: jiraConfig.boardId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Sync failed (${res.status})`)
      }

      const data = await res.json()
      const jiraStories: UserStory[] = data.issues
      setStories(jiraStories)
      localStorage.setItem("progressStories", JSON.stringify(jiraStories))
      const now = new Date().toLocaleString()
      setLastSynced(now)
      localStorage.setItem("progressLastSynced", now)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setSyncError(message)
    } finally {
      setIsSyncing(false)
    }
  }, [jiraConfig])

  const assignees = Array.from(new Set(stories.map(s => s.assignee).filter(Boolean)))

  function saveStory(story: UserStory) {
    // If status is CANCELLED, it will show in DONE column
    const updated = stories.some(s => s.id === story.id)
      ? stories.map(s => (s.id === story.id ? { ...story, updatedAt: new Date().toISOString() } : s))
      : [{ ...story, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...stories]

    setStories(updated)
    localStorage.setItem("progressStories", JSON.stringify(updated))
    setIsModalOpen(false)
    setEditingStory(null)
  }

  function updateStoryStatus(storyId: string, newStatus: Status) {
    const updated = stories.map(s => 
      s.id === storyId 
        ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } 
        : s
    )
    setStories(updated)
    localStorage.setItem("progressStories", JSON.stringify(updated))
  }

  function openEditModal(story: UserStory) {
    setEditingStory(story)
    setIsModalOpen(true)
  }

  // Drag and Drop handlers
  function handleDragStart(e: DragEvent<HTMLDivElement>, storyId: string) {
    setDraggedStoryId(storyId)
    e.dataTransfer.effectAllowed = "move"
  }

  function handleDragEnd() {
    setDraggedStoryId(null)
    setDragOverColumn(null)
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, column: Status) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(column)
  }

  function handleDragLeave() {
    setDragOverColumn(null)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, targetColumn: Status) {
    e.preventDefault()
    if (draggedStoryId) {
      updateStoryStatus(draggedStoryId, targetColumn)
    }
    setDraggedStoryId(null)
    setDragOverColumn(null)
  }

  // Get stories for a column (DONE column includes CANCELLED)
  function getStoriesForColumn(column: Status) {
    return stories
      .filter(s => {
        if (column === "DONE") {
          return s.status === "DONE" || s.status === "CANCELLED"
        }
        return s.status === column
      })
      .filter(s => !filterAssignee || s.assignee === filterAssignee)
      .filter(s => s.summary.toLowerCase().includes(search.toLowerCase()))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Progress Calculation</h1>
          {jiraConfig && isJiraConfigured(jiraConfig) ? (
            <Badge variant="secondary" className="text-xs">
              <Cloud className="h-3 w-3 mr-1" />
              Jira: {jiraConfig.projectKey}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              <CloudOff className="h-3 w-3 mr-1" />
              Jira not configured
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastSynced && (
            <span className="text-xs text-muted-foreground">Last synced: {lastSynced}</span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={syncFromJira}
            disabled={isSyncing || !jiraConfig || !isJiraConfigured(jiraConfig)}
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            {isSyncing ? "Syncing..." : "Sync from Jira"}
          </Button>
        </div>
      </div>

      {/* Jira config alert */}
      {jiraConfig && !isJiraConfigured(jiraConfig) && (
        <Alert variant="default" className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm text-amber-800">
              Jira is not configured yet. Add your email and API token in Settings to enable board sync.
            </span>
            <Button variant="outline" size="sm" asChild className="ml-4 shrink-0">
              <Link href="/settings">
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Go to Settings
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Sync error alert */}
      {syncError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{syncError}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        <input
          type="text"
          placeholder="Search..."
          className="border rounded px-2 py-1"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <Button onClick={() => { setEditingStory(null); setIsModalOpen(true) }}>Create</Button>

        <div className="flex gap-1 items-center ml-2">
          <span className="text-sm text-muted-foreground mr-1">Assignee:</span>
          <button
            onClick={() => setFilterAssignee("")}
            className={`px-2 py-1 border rounded text-sm ${filterAssignee === "" ? "bg-blue-500 text-white" : ""}`}
          >
            All
          </button>
          {assignees.map(a => (
            <button
              key={a}
              onClick={() => setFilterAssignee(a)}
              className={`px-2 py-1 border rounded text-sm ${filterAssignee === a ? "bg-blue-500 text-white" : ""}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-6 gap-4">
        {KANBAN_COLUMNS.map(column => {
          const columnStories = getStoriesForColumn(column)
          const isDropTarget = dragOverColumn === column
          const isDoneColumn = column === "DONE"
          const showViewOldRecords = isDoneColumn && columnStories.length > 10
          const displayedStories = isDoneColumn && columnStories.length > 10 
            ? columnStories.slice(0, 10) 
            : columnStories

          return (
            <Card 
              key={column}
              className={`min-h-[300px] transition-colors ${isDropTarget ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
              onDragOver={(e) => handleDragOver(e, column)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex justify-between items-center">
                  <span>{column}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {columnStories.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {displayedStories.map(story => (
                  <div
                    key={story.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, story.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => openEditModal(story)}
                    className={`cursor-pointer rounded border p-2 text-sm hover:shadow-md transition-shadow ${
                      STATUS_COLORS[story.status]
                    } ${draggedStoryId === story.id ? "opacity-50" : ""}`}
                  >
                    <div className="font-medium">{story.summary}</div>
                    {story.assignee && (
                      <div className="text-xs mt-1 opacity-70">{story.assignee}</div>
                    )}
                    {story.status === "CANCELLED" && (
                      <div className="text-xs mt-1 font-semibold">CANCELLED</div>
                    )}
                  </div>
                ))}
                {showViewOldRecords && (
                  <Button
                    variant="link"
                    size="sm"
                    className="w-full text-blue-600 hover:text-blue-800"
                    onClick={() => window.open("/progress-calculation/history", "_blank")}
                  >
                    View Old Records ({columnStories.length - 10} more)
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {isModalOpen && (
        <StoryModal
          story={editingStory}
          onClose={() => {
            setIsModalOpen(false)
            setEditingStory(null)
          }}
          onSave={saveStory}
        />
      )}
    </div>
  )
}
