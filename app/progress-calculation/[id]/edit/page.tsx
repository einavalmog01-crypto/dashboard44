"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select"
import { UserStory, STATUSES } from "../../modal-helpers"

export default function EditStoryPage() {
  const { id } = useParams()
  const router = useRouter()
  const [form, setForm] = useState<UserStory | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("progressStories")
    if (!saved) return
    const stories: UserStory[] = JSON.parse(saved)
    const story = stories.find(s => s.id === id) ?? null
    if (story) {
      setForm({
        ...story,
        attachments: Array.isArray(story.attachments) ? story.attachments : [],
        updatedAt: story.updatedAt || new Date().toISOString(),
      })
    }
  }, [id])

  if (!form) return <div className="p-8">Story not found</div>

  function onSave() {
    const saved = localStorage.getItem("progressStories")
    if (!saved) return
    const stories: UserStory[] = JSON.parse(saved)
    const updated = stories.map(s => (s.id === id ? form : s))
    localStorage.setItem("progressStories", JSON.stringify(updated))
    router.push(`/progress-calculation/${id}`)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Save button on top */}
      <div className="flex justify-end gap-2 mb-4">
        <Button onClick={onSave} disabled={!form.summary.trim()}>Save</Button>
      </div>

      {/* Status */}
      <label className="flex flex-col gap-1">
        Status
        <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as UserStory["status"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </label>

      {/* Other fields */}
      <label className="flex flex-col gap-1">
        Summary
        <Input value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
      </label>

      <label className="flex flex-col gap-1">
        Branch
        <Input value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} />
      </label>

      <label className="flex flex-col gap-1">
        Assignee
        <Input value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })} />
      </label>

      <label className="flex flex-col gap-1">
        Description
        <Textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="min-h-[200px] resize-y"
        />
      </label>
    </div>
  )
}
