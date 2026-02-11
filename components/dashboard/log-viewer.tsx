"use client"

import { useState, useEffect } from "react"
import { X, RefreshCw, Download, Copy, Check, Server, FileText, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Environment, EnvironmentConfig } from "@/lib/environment-config"
import {
  logServersConfig,
  generateSimulatedLog,
  type LogServer,
  type LogFile,
} from "@/lib/log-config"

interface LogViewerProps {
  isOpen?: boolean
  environment: Environment
  environmentConfig?: EnvironmentConfig
  fullscreen?: boolean
  onClose?: () => void
}

export function LogViewer({
  isOpen = true,
  fullscreen = false,
  environment,
  environmentConfig,
  onClose,
}: LogViewerProps) {
  const [selectedServer, setSelectedServer] = useState<LogServer>("WF1")
  const [selectedFile, setSelectedFile] = useState<LogFile>("catalina.out")
  const [logContent, setLogContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const currentServerConfig = logServersConfig.find(
    s => s.name === selectedServer
  )

  const unixConfigured =
    environmentConfig?.unix?.hostName &&
    environmentConfig?.unix?.userName

  const loadLogs = () => {
    setIsLoading(true)
    setTimeout(() => {
      setLogContent(
        generateSimulatedLog(selectedServer, selectedFile, environment)
      )
      setIsLoading(false)
    }, 800)
  }

  useEffect(() => {
    if (isOpen) loadLogs()
  }, [isOpen, selectedServer, selectedFile, environment])

  useEffect(() => {
    if (autoRefresh && isOpen) {
      const interval = setInterval(loadLogs, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, isOpen, selectedServer, selectedFile, environment])

  if (!isOpen) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(logContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([logContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${environment}_${selectedServer}_${selectedFile}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const content = (
    <div className="flex flex-col h-full bg-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Terminal className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Backend Logs</h2>
            <p className="text-xs text-muted-foreground">
              Environment:{" "}
              <span className="text-primary">{environment}</span>
              {currentServerConfig && (
                <span className="ml-2 text-muted-foreground/70">
                  Path: {currentServerConfig.basePath}/{selectedFile}
                </span>
              )}
            </p>
          </div>
        </div>

        {!fullscreen && onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Unix Warning */}
      {!unixConfigured && (
        <div className="mx-4 mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-sm text-amber-400">
            <strong>Note:</strong> UNIX connection not configured for{" "}
            {environment}.
          </p>
        </div>
      )}

      {/* Servers & Files */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-2">Server:</span>
          <div className="flex gap-2">
            {logServersConfig.map(server => (
              <Button
                key={server.name}
                variant={
                  selectedServer === server.name ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedServer(server.name)}
                className={cn(
                  "transition-all",
                  selectedServer === server.name &&
                    "bg-primary text-primary-foreground"
                )}
              >
                {server.name}
                <span className="ml-1 text-xs opacity-70">
                  ({server.label})
                </span>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-2">
            Log File:
          </span>
          <div className="flex gap-2">
            {currentServerConfig?.logFiles.map(file => (
              <Button
                key={file}
                variant={selectedFile === file ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFile(file)}
                className={cn(
                  "transition-all font-mono text-xs",
                  selectedFile === file &&
                    "bg-primary text-primary-foreground"
                )}
              >
                {file}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={isLoading}
            className="gap-2 bg-transparent"
          >
            <RefreshCw
              className={cn("h-4 w-4", isLoading && "animate-spin")}
            />
            Refresh
          </Button>

          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "gap-2",
              autoRefresh && "bg-neon-green text-black"
            )}
          >
            {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2 bg-transparent"
          >
            {copied ? (
              <Check className="h-4 w-4 text-neon-green" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2 bg-transparent"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Log Content */}
      <div className="flex-1 overflow-auto p-4 bg-black/50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading logs...</span>
            </div>
          </div>
        ) : (
          <pre className="font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {logContent || "No logs available."}
          </pre>
        )}
      </div>
    </div>
  )

  // 🔥 FULLSCREEN MODE
  if (fullscreen) {
    return <div className="h-full w-full overflow-auto">{content}</div>
  }

  // 🪟 MODAL MODE
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[90vh] rounded-lg shadow-2xl overflow-hidden">
        {content}
      </div>
    </div>
  )
}
