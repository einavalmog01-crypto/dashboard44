"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { nanoid } from "nanoid"

const STORAGE_KEY = "documentationData"

// Types
export type Branch = {
  id: string
  name: string
  createdAt: number
}

export type DocCategory = "run-book" | "installation-guide" | "other-documents"
export type DocSystem = "ogw" | "o2a-sky"

export type Document = {
  id: string
  branchId: string
  category: DocCategory
  system: DocSystem
  title: string
  description?: string
  fileName?: string
  fileData?: string  // base64 for uploaded files
  url?: string
  createdAt: number
  updatedAt: number
}

interface DocumentationContextType {
  // Branches
  branches: Branch[]
  selectedBranchId: string | null
  setSelectedBranchId: (id: string | null) => void
  addBranch: (name: string) => void
  editBranch: (id: string, name: string) => void
  deleteBranch: (id: string) => void

  // Selected category/system
  selectedCategory: DocCategory | null
  selectedSystem: DocSystem | null
  setSelectedCategory: (cat: DocCategory | null) => void
  setSelectedSystem: (sys: DocSystem | null) => void

  // Documents
  documents: Document[]
  addDocument: (branchId: string, category: DocCategory, system: DocSystem, title: string, description?: string, fileName?: string, fileData?: string, url?: string) => void
  editDocument: (id: string, updates: Partial<Omit<Document, "id" | "branchId" | "category" | "system" | "createdAt">>) => void
  deleteDocument: (id: string) => void
  getDocuments: (branchId: string, category: DocCategory, system: DocSystem) => Document[]
}

const DocumentationContext = createContext<DocumentationContextType | null>(null)

export function useDocumentation() {
  const context = useContext(DocumentationContext)
  if (!context) {
    throw new Error("useDocumentation must be used within a DocumentationProvider")
  }
  return context
}

function loadInitialData(): { branches: Branch[]; documents: Document[] } {
  if (typeof window === "undefined") {
    return { branches: [], documents: [] }
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return {
        branches: data.branches || [],
        documents: data.documents || [],
      }
    }
  } catch {
    // Use defaults
  }
  return { branches: [], documents: [] }
}

export function DocumentationProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<DocCategory | null>(null)
  const [selectedSystem, setSelectedSystem] = useState<DocSystem | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const data = loadInitialData()
    setBranches(data.branches)
    setDocuments(data.documents)
    setIsHydrated(true)
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ branches, documents }))
    } catch {
      // Ignore
    }
  }, [branches, documents, isHydrated])

  // Branch functions
  const addBranch = (name: string) => {
    const newBranch: Branch = {
      id: nanoid(),
      name,
      createdAt: Date.now(),
    }
    setBranches(prev => [newBranch, ...prev])
  }

  const editBranch = (id: string, name: string) => {
    setBranches(prev =>
      prev.map(b => (b.id === id ? { ...b, name } : b))
    )
  }

  const deleteBranch = (id: string) => {
    setBranches(prev => prev.filter(b => b.id !== id))
    // Also delete documents for this branch
    setDocuments(prev => prev.filter(d => d.branchId !== id))
    if (selectedBranchId === id) {
      setSelectedBranchId(null)
      setSelectedCategory(null)
      setSelectedSystem(null)
    }
  }

  // Document functions
  const addDocument = (
    branchId: string,
    category: DocCategory,
    system: DocSystem,
    title: string,
    description?: string,
    fileName?: string,
    fileData?: string,
    url?: string
  ) => {
    const now = Date.now()
    const newDoc: Document = {
      id: nanoid(),
      branchId,
      category,
      system,
      title,
      description,
      fileName,
      fileData,
      url,
      createdAt: now,
      updatedAt: now,
    }
    setDocuments(prev => [...prev, newDoc])
  }

  const editDocument = (id: string, updates: Partial<Omit<Document, "id" | "branchId" | "category" | "system" | "createdAt">>) => {
    setDocuments(prev =>
      prev.map(d =>
        d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d
      )
    )
  }

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  const getDocuments = (branchId: string, category: DocCategory, system: DocSystem) => {
    return documents.filter(
      d => d.branchId === branchId && d.category === category && d.system === system
    )
  }

  return (
    <DocumentationContext.Provider
      value={{
        branches,
        selectedBranchId,
        setSelectedBranchId,
        addBranch,
        editBranch,
        deleteBranch,
        selectedCategory,
        selectedSystem,
        setSelectedCategory,
        setSelectedSystem,
        documents,
        addDocument,
        editDocument,
        deleteDocument,
        getDocuments,
      }}
    >
      {children}
    </DocumentationContext.Provider>
  )
}
