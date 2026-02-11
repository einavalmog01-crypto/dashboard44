"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogViewer } from "./log-viewer"
import type { Environment } from "@/lib/environment-config"
import { useEnvironment } from "@/lib/environment-context"

interface HeaderProps {
  title: string
  description?: string
}

const ENVS: Environment[] = ["SST", "CRs", "DEV3ST", "DEV4ST", "DEV5ST", "DEV360"]

export function Header({ title, description }: HeaderProps) {
  const { selectedEnv, setSelectedEnv, currentEnvironmentConfig } = useEnvironment()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false)

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
        {/* Title & Description */}
        <div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Right side: Avatar, Env */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-secondary text-foreground text-xs">
              AT
            </AvatarFallback>
          </Avatar>

          {/* Environment Dropdown */}
          <div className="relative ml-auto">
            <button
              className={`flex items-center justify-between w-28 px-3 py-1 rounded
                ${dropdownOpen ? "bg-white text-black" : "bg-black text-white"}
                border border-border`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {selectedEnv}
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>

            {dropdownOpen && (
              <ul className="absolute right-0 mt-1 w-28 border border-border bg-white text-black rounded shadow-lg z-50">
                {ENVS.map((env) => (
                  <li
                    key={env}
                    className="px-3 py-1 hover:bg-gray-200 cursor-pointer"
                    onClick={() => {
                      setSelectedEnv(env)
                      setDropdownOpen(false)
                    }}
                  >
                    {env}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </header>

      {/* LogViewer modal - uses currentEnvironmentConfig from context */}
      {isLogViewerOpen && (
        <LogViewer
          isOpen={isLogViewerOpen}
          onClose={() => setIsLogViewerOpen(false)}
          environment={selectedEnv}
          environmentConfig={currentEnvironmentConfig}
        />
      )}
    </>
  )
}
