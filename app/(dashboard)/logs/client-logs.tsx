"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { LogViewer } from "@/components/dashboard/log-viewer"
import { useEnvironment } from "@/lib/environment-context"

export default function ClientLogs() {
  const searchParams = useSearchParams()
  const { selectedEnv, setSelectedEnv, currentEnvironmentConfig } = useEnvironment()
  const envFromQuery = searchParams.get("env")

  // On initial load, set the environment from the URL query param (if provided)
  useEffect(() => {
    if (envFromQuery && envFromQuery !== selectedEnv) {
      setSelectedEnv(envFromQuery as typeof selectedEnv)
    }
  }, []) // Only run once on mount

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <div className="border-b px-6 py-3">
        <h1 className="text-xl font-semibold">Backend Logs</h1>
        <p className="text-sm text-muted-foreground">
          Environment: {selectedEnv}
          {currentEnvironmentConfig?.isConfigured && (
            <span className="ml-2 text-green-500">(Configured)</span>
          )}
          {!currentEnvironmentConfig?.isConfigured && (
            <span className="ml-2 text-amber-500">(Not configured - go to Settings)</span>
          )}
        </p>
      </div>

      <div className="h-[calc(100vh-64px)]">
        <LogViewer
          fullscreen
          environment={selectedEnv}
          environmentConfig={currentEnvironmentConfig}
        />
      </div>
    </div>
  )
}
