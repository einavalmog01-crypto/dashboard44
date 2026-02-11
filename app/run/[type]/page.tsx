"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"

export default function SanityRun() {
  const { type } = useParams<{ type: string }>()
  const searchParams = useSearchParams()
  const selectedEnv = searchParams.get("env") || "SST"
  const sanityType = type === "full-sanity" ? "FULL" : "BASIC"

  const [logs, setLogs] = useState<string[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    const host = window.location.hostname
    const wsPort = 8081

    const ws = new WebSocket(`ws://${host}:${wsPort}`)

    ws.onopen = () => {
      // Send both sanity type and environment to the WebSocket server
      ws.send(JSON.stringify({ type: sanityType, env: selectedEnv }))
    }

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.log) setLogs(l => [...l, data.log])
        if (data.done) setDone(true)
      } catch {
        // ignore malformed messages
      }
    }

    ws.onerror = () => {
      setLogs(l => [...l, "WebSocket connection error\n"])
    }

    return () => ws.close()
  }, [sanityType, selectedEnv])

  return (
    <div style={{ padding: 20 }}>
      <h2>
        Running {sanityType === "FULL" ? "Full Sanity" : "Basic Sanity"} on {selectedEnv}
      </h2>

      <pre
        style={{
          background: "#000",
          color: "#0f0",
          padding: 10,
          height: 400,
          overflow: "auto",
        }}
      >
        {logs.join("")}
      </pre>

      {done && (
        <button
          onClick={() => window.open("/reports", "_blank")}
          style={{ marginTop: 20 }}
        >
          Reports
        </button>
      )}
    </div>
  )
}
