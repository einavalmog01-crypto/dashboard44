"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  type Environment,
  type EnvironmentConfig,
  defaultEnvironments,
  isEnvironmentConfigured,
} from "./environment-config"

interface EnvironmentContextType {
  selectedEnv: Environment
  setSelectedEnv: (env: Environment) => void
  environments: EnvironmentConfig[]
  setEnvironments: React.Dispatch<React.SetStateAction<EnvironmentConfig[]>>
  currentEnvironmentConfig: EnvironmentConfig | undefined
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined)

const STORAGE_KEY = "dashboard-environments"
const SELECTED_ENV_KEY = "dashboard-selected-env"

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [environments, setEnvironments] = useState<EnvironmentConfig[]>(() => {
    if (typeof window === "undefined") return defaultEnvironments
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as EnvironmentConfig[]
        return parsed.map((env) => ({
          ...env,
          isConfigured: isEnvironmentConfigured(env),
        }))
      }
    } catch {
      // ignore
    }
    return defaultEnvironments
  })

  const [selectedEnv, setSelectedEnv] = useState<Environment>(() => {
    if (typeof window === "undefined") return "CRs"
    try {
      const stored = localStorage.getItem(SELECTED_ENV_KEY)
      if (stored) return stored as Environment
    } catch {
      // ignore
    }
    return "CRs"
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(environments))
    } catch {
      // ignore
    }
  }, [environments])

  useEffect(() => {
    try {
      localStorage.setItem(SELECTED_ENV_KEY, selectedEnv)
    } catch {
      // ignore
    }
  }, [selectedEnv])

  const currentEnvironmentConfig = environments.find((e) => e.name === selectedEnv)

  return (
    <EnvironmentContext.Provider
      value={{
        selectedEnv,
        setSelectedEnv,
        environments,
        setEnvironments,
        currentEnvironmentConfig,
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  )
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext)
  if (!context) {
    throw new Error("useEnvironment must be used within an EnvironmentProvider")
  }
  return context
}
