"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserStory, STATUS_COLORS } from "../modal-helpers"

function normalizeStory(story: any): UserStory {
  return {
    id: story.id || crypto.randomUUID(),
    status: story.status || "TO DO",
    summary: story.summary || "",
    branch: story.branch || "",
    description: story.description || "",
    assignee: story.assignee || "",
    updatedAt: story.updatedAt || new Date().toISOString(),
    attachments: Array.isArray(story.attachments)
      ? story.attachments
      : typeof story.attachments === "string"
      ? [{ name: story.attachments.split("/").pop() || "attachment", url: story.attachments }]
      : [],
    comments: Array.isArray(story.comments) ? story.comments : [],
  }
}

export default function StoryPage() {
  const { id } = useParams()
  const router = useRouter()
  const [story, setStory] = useState<UserStory | null>(null)
  const [commentText, setCommentText] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("progressStories")
    if (!saved) return
    const storiesRaw = JSON.parse(saved)
    const stories: UserStory[] = storiesRaw.map(normalizeStory)
    const found = stories.find(s => s.id === id)
    setStory(found ?? null)
  }, [id])

  if (!story) return <div className="p-8">Story not found</div>

  function saveStory(updated: UserStory) {
    const saved = localStorage.getItem("progressStories")
    if (!saved) return
    const all: UserStory[] = JSON.parse(saved)
    const updatedAll = all.map(s => (s.id === updated.id ? updated : s))
    localStorage.setItem("progressStories", JSON.stringify(updatedAll))
    setStory(updated)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 print:p-0">
      {/* Header */}
      <div className="flex justify-between items-start print:hidden">
        <div>
          <h1 className="text-3xl font-bold">{story.summary}</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(story.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/progress-calculation/${story.id}/edit`)}>
            Edit
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
        <Card>
          <CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent>
            <Badge className={STATUS_COLORS[story.status]}>{story.status}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Branch</CardTitle></CardHeader>
          <CardContent>{story.branch || "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Assignee</CardTitle></CardHeader>
          <CardContent>{story.assignee || "—"}</CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader><CardTitle>Description</CardTitle></CardHeader>
        <CardContent className="whitespace-pre-wrap leading-relaxed">
          {story.description || "No description"}
        </CardContent>
      </Card>

      {/* Attachments */}
      {story.attachments.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Attachments</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {story.attachments.map((a, i) => (
              <a key={i} href={a.url} download className="block text-blue-600 underline">
                {a.name}
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {story.comments!.length === 0 && (
            <div className="text-sm text-muted-foreground">No comments yet</div>
          )}

          {/* Sorted newest first */}
          {story.comments!
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(c => (
              <div key={c.id} className="border rounded p-3 bg-muted/30">
                <div className="text-sm whitespace-pre-wrap">{c.text}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(c.createdAt).toLocaleString()}
                </div>
              </div>
            ))}

          {/* Add new comment */}
          <div className="pt-4 border-t space-y-2">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full border rounded p-2 text-sm"
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                disabled={!commentText.trim()}
                onClick={() => {
                  saveStory({
                    ...story,
                    comments: [
                      {
                        id: crypto.randomUUID(),
                        text: commentText.trim(),
                        createdAt: new Date().toISOString(),
                      },
                      ...(story.comments || []), // prepend new comment
                    ],
                    updatedAt: new Date().toISOString(),
                  })
                  setCommentText("")
                }}
              >
                Add Comment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
