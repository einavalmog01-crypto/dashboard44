"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/* ================= TYPES & CONSTANTS ================= */

export type Status =
  | "TO DO"
  | "IN PROGRESS"
  | "BLOCKED"
  | "ON HOLD"
  | "SST TESTING"
  | "DONE"
  | "CANCELLED"

export interface Attachment {
  name: string
  url: string
}

/* ✅ NEW (non-breaking) */
export interface StoryComment {
  id: string
  text: string
  createdAt: string
}

export interface UserStory {
  id: string
  status: Status
  summary: string
  branch: string
  description: string
  assignee: string
  attachments: Attachment[]
  createdAt: string
  updatedAt: string

  /* ✅ NEW (optional) */
  comments?: StoryComment[]
}

export const STATUSES: Status[] = [
  "TO DO",
  "IN PROGRESS",
  "BLOCKED",
  "ON HOLD",
  "SST TESTING",
  "DONE",
  "CANCELLED",
]

// Columns for the Kanban board (CANCELLED items show in DONE column)
export const KANBAN_COLUMNS: Status[] = [
  "TO DO",
  "IN PROGRESS",
  "BLOCKED",
  "ON HOLD",
  "SST TESTING",
  "DONE",
]

export const STATUS_COLORS: Record<Status, string> = {
  "TO DO": "bg-gray-200 text-gray-800",
  "IN PROGRESS": "bg-blue-200 text-blue-900",
  "BLOCKED": "bg-red-200 text-red-900",
  "ON HOLD": "bg-yellow-200 text-yellow-900",
  "SST TESTING": "bg-purple-200 text-purple-900",
  "DONE": "bg-green-200 text-green-900",
  "CANCELLED": "bg-gray-400 text-gray-900 line-through",
}

/* ================= MODAL COMPONENT ================= */

export function StoryModal({
  story,
  onClose,
  onSave,
}: {
  story: UserStory | null
  onClose: () => void
  onSave: (story: UserStory) => void
}) {
  const [form, setForm] = useState<UserStory>(
    story ?? {
      id: crypto.randomUUID(),
      status: "TO DO",
      summary: "",
      branch: "",
      description: "",
      assignee: "",
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
    }
  )

  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setScrolled(el.scrollTop > 0)
    el.addEventListener("scroll", onScroll)
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={onClose}
    >
      <div
        className="bg-white text-black rounded-lg w-[900px] max-h-[90vh] flex flex-col"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b sticky top-0 bg-white z-10 ${scrolled ? "shadow-sm" : ""}`}>
          <h2 className="text-lg font-semibold">{story ? "Edit User Story" : "Create User Story"}</h2>
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="px-6 py-4 space-y-6 overflow-y-auto">
          {/* Status */}
          <label className="flex flex-col gap-1">
            Status
            <Select
              value={form.status}
              onValueChange={v => setForm({ ...form, status: v as Status })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          {/* Summary & Branch */}
          <div className="border-t pt-4 space-y-4">
            <Input
              placeholder="Summary"
              value={form.summary}
              onChange={e => setForm({ ...form, summary: e.target.value })}
            />
            <Input
              placeholder="Branch (e.g. Wave 10.2)"
              value={form.branch}
              onChange={e => setForm({ ...form, branch: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="border-t pt-4">
            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="min-h-[200px] resize-y"
            />
          </div>

          {/* Assignee & Attachments */}
          <div className="border-t pt-4 space-y-4">
            <Input
              placeholder="Assignee"
              value={form.assignee}
              onChange={e => setForm({ ...form, assignee: e.target.value })}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm">Attachments</label>
              <Input
                type="file"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // Convert file to base64 data URL for persistence in localStorage
                    const reader = new FileReader()
                    reader.onload = () => {
                      const dataUrl = reader.result as string
                      setForm(prev => ({
                        ...prev,
                        attachments: [...prev.attachments, { name: file.name, url: dataUrl }],
                      }))
                    }
                    reader.readAsDataURL(file)
                  }
                }}
              />
              {form.attachments.length > 0 && (
                <div className="space-y-1 mt-2">
                  <span className="text-xs text-muted-foreground">Attachments:</span>
                  {form.attachments.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <a 
                        href={a.url} 
                        download={a.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {a.name}
                      </a>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          attachments: prev.attachments.filter((_, i) => i !== idx)
                        }))}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t sticky bottom-0 bg-white shadow-inner flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!form.summary.trim()}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
