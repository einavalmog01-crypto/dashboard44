"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { StoryModal, UserStory } from "../modal-helpers"

export default function CreateStoryPage() {
  const router = useRouter()
  const [stories, setStories] = useState<UserStory[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("progressStories")
    if (saved) setStories(JSON.parse(saved))
  }, [])

  function saveStory(story: UserStory) {
    const updated = [story, ...stories]
    setStories(updated)
    localStorage.setItem("progressStories", JSON.stringify(updated))
    router.push("/progress-calculation")
  }

  return (
    <StoryModal
      story={null}
      onClose={() => router.push("/progress-calculation")}
      onSave={saveStory}
    />
  )
}
