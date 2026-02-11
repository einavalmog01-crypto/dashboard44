"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserStory, STATUS_COLORS } from "../modal-helpers"

export default function HistoryPage() {
  const [stories, setStories] = useState<UserStory[]>([])
  const [selected, setSelected] = useState<UserStory | null>(null)
  const [search, setSearch] = useState("")

  function normalizeStories(stories: any[]): UserStory[] {
    return stories.map(s => ({
      id: s.id || crypto.randomUUID(),
      status: s.status || "TO DO",
      summary: s.summary || "",
      branch: s.branch || "",
      description: s.description || "",
      assignee: s.assignee || "",
      updatedAt: s.updatedAt || new Date().toISOString(),
      attachments: Array.isArray(s.attachments)
        ? s.attachments
        : typeof s.attachments === "string"
        ? [{ name: s.attachments.split("/").pop() || "attachment", url: s.attachments }]
        : [],
    }))
  }

  useEffect(() => {
    const saved = localStorage.getItem("progressStories")
    if (!saved) return
    const all = normalizeStories(JSON.parse(saved))
    // Include both DONE and CANCELLED stories (same as DONE column on main page)
    const doneStories = all
      .filter(s => s.status === "DONE" || s.status === "CANCELLED")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    setStories(doneStories)
    setSelected(doneStories[0] ?? null)
  }, [])

  return (
    <div className="h-screen grid grid-cols-[320px_1fr]">
      {/* LEFT LIST */}
      <div className="border-r overflow-y-auto p-4 space-y-2">
        <h2 className="text-lg font-semibold mb-3">Done Records ({stories.length})</h2>
        <input
          type="text"
          placeholder="Search..."
          className="border rounded px-2 py-1 w-full mb-2"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {stories
          .filter(s => s.summary.toLowerCase().includes(search.toLowerCase()))
          .map(story => (
            <div
              key={story.id}
              onClick={() => setSelected(story)}
              className={`cursor-pointer rounded border p-2 text-sm ${
                selected?.id === story.id ? "bg-gray-100 border-gray-400" : "hover:bg-gray-50"
              }`}
            >
              <div className="font-medium">{story.summary}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(story.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
      </div>

      {/* RIGHT DETAILS */}
      <div className="p-8 overflow-y-auto">
        {!selected ? (
          <div className="text-muted-foreground">Select a story from the left</div>
        ) : (
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-3xl font-bold">{selected.summary}</h1>
            <div className="flex gap-6 text-sm">
              <Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge>
              <span><strong>Branch:</strong> {selected.branch || "—"}</span>
              <span><strong>Assignee:</strong> {selected.assignee || "—"}</span>
              <span><strong>Last updated:</strong> {new Date(selected.updatedAt).toLocaleString()}</span>
            </div>

            <Card>
              <CardHeader><CardTitle>Description</CardTitle></CardHeader>
              <CardContent className="whitespace-pre-wrap leading-relaxed">
                {selected.description || "No description"}
              </CardContent>
            </Card>

            {selected.attachments.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Attachments</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {selected.attachments.map((a, i) => (
                    <a key={i} href={a.url} download className="block text-blue-600 underline">
                      {a.name}
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
