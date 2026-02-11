"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

// ---------- Types ----------

export interface Branch {
  id: string
  name: string
  createdAt: number
}

export interface Folder {
  id: string
  branchId: string
  name: string
  type: "us" | "cr"
}

export interface SubItem {
  id: string
  folderId: string
  type: "user-story" | "cr"
  name: string
  description?: string
}

export interface TestStep {
  id: string
  stepNumber: number
  description: string
  expectedResult: string
}

export interface TestAttachment {
  name: string
  url: string
}

export interface TestCase {
  id: string
  subItemId: string
  name: string
  status: "pending" | "pass" | "fail"
  steps: TestStep[]
  attachments: TestAttachment[]
  comment: string
}

// ---------- Context value ----------

interface TestCasesContextValue {
  branches: Branch[]
  selectedBranchId: string | null
  setSelectedBranchId: (id: string | null) => void
  addBranch: (name: string) => void
  editBranch: (id: string, name: string) => void
  deleteBranch: (id: string) => void

  folders: Folder[]
  selectedFolderId: string | null
  setSelectedFolderId: (id: string | null) => void
  editFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void

  subItems: SubItem[]
  selectedSubItemId: string | null
  setSelectedSubItemId: (id: string | null) => void
  addSubItem: (folderId: string, type: "user-story" | "cr", name: string, description?: string) => void
  editSubItem: (id: string, name: string, description?: string) => void
  deleteSubItem: (id: string) => void

  testCases: TestCase[]
  addTestCase: (subItemId: string, name: string) => void
  editTestCase: (id: string, updates: Partial<Pick<TestCase, "name" | "status" | "attachments" | "comment">>) => void
  deleteTestCase: (id: string) => void
  addTestStep: (testCaseId: string, description: string, expectedResult: string) => void
  editTestStep: (testCaseId: string, stepId: string, description: string, expectedResult: string) => void
  deleteTestStep: (testCaseId: string, stepId: string) => void
}

const TestCasesContext = createContext<TestCasesContextValue | null>(null)

// ---------- Helpers ----------

const LS_KEY = "test-cases-data"

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface PersistedState {
  branches: Branch[]
  folders: Folder[]
  subItems: SubItem[]
  testCases: TestCase[]
}

function loadState(): PersistedState {
  if (typeof window === "undefined") return { branches: [], folders: [], subItems: [], testCases: [] }
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as PersistedState
  } catch { /* ignore */ }
  return { branches: [], folders: [], subItems: [], testCases: [] }
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

// ---------- Provider ----------

export function TestCasesProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>(() => loadState().branches)
  const [folders, setFolders] = useState<Folder[]>(() => loadState().folders)
  const [subItems, setSubItems] = useState<SubItem[]>(() => loadState().subItems)
  const [testCases, setTestCases] = useState<TestCase[]>(() => loadState().testCases)

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedSubItemId, setSelectedSubItemId] = useState<string | null>(null)

  // Persist helper
  const persist = useCallback(
    (b: Branch[], f: Folder[], s: SubItem[], t: TestCase[]) =>
      saveState({ branches: b, folders: f, subItems: s, testCases: t }),
    []
  )

  // ---- Branch CRUD ----

  const addBranch = useCallback((name: string) => {
    const newBranch: Branch = { id: uid(), name, createdAt: Date.now() }
    setBranches(prev => {
      const next = [...prev, newBranch]
      // Auto-create default folders for this branch
      const usFoldr: Folder = { id: uid(), branchId: newBranch.id, name: "User Stories", type: "us" }
      const crFoldr: Folder = { id: uid(), branchId: newBranch.id, name: "CRs / SRs", type: "cr" }
      setFolders(fp => {
        const nextF = [...fp, usFoldr, crFoldr]
        persist(next, nextF, subItems, testCases)
        return nextF
      })
      return next
    })
  }, [persist, subItems, testCases])

  const editBranch = useCallback((id: string, name: string) => {
    setBranches(prev => {
      const next = prev.map(b => b.id === id ? { ...b, name } : b)
      persist(next, folders, subItems, testCases)
      return next
    })
  }, [folders, persist, subItems, testCases])

  const deleteBranch = useCallback((id: string) => {
    setBranches(prev => {
      const next = prev.filter(b => b.id !== id)
      const branchFolderIds = folders.filter(f => f.branchId === id).map(f => f.id)
      const branchSubItemIds = subItems.filter(s => branchFolderIds.includes(s.folderId)).map(s => s.id)
      setFolders(fp => {
        const nextF = fp.filter(f => f.branchId !== id)
        setSubItems(sp => {
          const nextS = sp.filter(s => !branchFolderIds.includes(s.folderId))
          setTestCases(tp => {
            const nextT = tp.filter(t => !branchSubItemIds.includes(t.subItemId))
            persist(next, nextF, nextS, nextT)
            return nextT
          })
          return nextS
        })
        return nextF
      })
      if (selectedBranchId === id) {
        setSelectedBranchId(null)
        setSelectedFolderId(null)
        setSelectedSubItemId(null)
      }
      return next
    })
  }, [folders, subItems, persist, selectedBranchId])

  // ---- Folder CRUD ----

  const editFolder = useCallback((id: string, name: string) => {
    setFolders(prev => {
      const next = prev.map(f => f.id === id ? { ...f, name } : f)
      persist(branches, next, subItems, testCases)
      return next
    })
  }, [branches, persist, subItems, testCases])

  const deleteFolder = useCallback((id: string) => {
    const folderSubItemIds = subItems.filter(s => s.folderId === id).map(s => s.id)
    setFolders(prev => {
      const next = prev.filter(f => f.id !== id)
      setSubItems(sp => {
        const nextS = sp.filter(s => s.folderId !== id)
        setTestCases(tp => {
          const nextT = tp.filter(t => !folderSubItemIds.includes(t.subItemId))
          persist(branches, next, nextS, nextT)
          return nextT
        })
        return nextS
      })
      if (selectedFolderId === id) {
        setSelectedFolderId(null)
        setSelectedSubItemId(null)
      }
      return next
    })
  }, [branches, subItems, persist, selectedFolderId])

  // ---- Sub-item CRUD ----

  const addSubItem = useCallback(
    (folderId: string, type: "user-story" | "cr", name: string, description?: string) => {
      setSubItems(prev => {
        const next = [...prev, { id: uid(), folderId, type, name, description }]
        persist(branches, folders, next, testCases)
        return next
      })
    },
    [branches, folders, persist, testCases]
  )

  const editSubItem = useCallback(
    (id: string, name: string, description?: string) => {
      setSubItems(prev => {
        const next = prev.map(s => s.id === id ? { ...s, name, description } : s)
        persist(branches, folders, next, testCases)
        return next
      })
    },
    [branches, folders, persist, testCases]
  )

  const deleteSubItem = useCallback((id: string) => {
    setSubItems(prev => {
      const next = prev.filter(s => s.id !== id)
      setTestCases(tp => {
        const nextT = tp.filter(t => t.subItemId !== id)
        persist(branches, folders, next, nextT)
        return nextT
      })
      if (selectedSubItemId === id) setSelectedSubItemId(null)
      return next
    })
  }, [branches, folders, persist, selectedSubItemId])

  // ---- Test Case CRUD ----

  const addTestCase = useCallback(
    (subItemId: string, name: string) => {
      setTestCases(prev => {
        const next = [
          ...prev,
          { id: uid(), subItemId, name, status: "pending" as const, steps: [], attachments: [], comment: "" },
        ]
        persist(branches, folders, subItems, next)
        return next
      })
    },
    [branches, folders, subItems, persist]
  )

  const editTestCase = useCallback(
    (id: string, updates: Partial<Pick<TestCase, "name" | "status" | "attachments" | "comment">>) => {
      setTestCases(prev => {
        const next = prev.map(t => (t.id === id ? { ...t, ...updates } : t))
        persist(branches, folders, subItems, next)
        return next
      })
    },
    [branches, folders, subItems, persist]
  )

  const deleteTestCase = useCallback(
    (id: string) => {
      setTestCases(prev => {
        const next = prev.filter(t => t.id !== id)
        persist(branches, folders, subItems, next)
        return next
      })
    },
    [branches, folders, subItems, persist]
  )

  // ---- Test Step CRUD ----

  const addTestStep = useCallback(
    (testCaseId: string, description: string, expectedResult: string) => {
      setTestCases(prev => {
        const next = prev.map(tc => {
          if (tc.id !== testCaseId) return tc
          const stepNumber = tc.steps.length + 1
          return { ...tc, steps: [...tc.steps, { id: uid(), stepNumber, description, expectedResult }] }
        })
        persist(branches, folders, subItems, next)
        return next
      })
    },
    [branches, folders, subItems, persist]
  )

  const editTestStep = useCallback(
    (testCaseId: string, stepId: string, description: string, expectedResult: string) => {
      setTestCases(prev => {
        const next = prev.map(tc => {
          if (tc.id !== testCaseId) return tc
          return {
            ...tc,
            steps: tc.steps.map(s => (s.id === stepId ? { ...s, description, expectedResult } : s)),
          }
        })
        persist(branches, folders, subItems, next)
        return next
      })
    },
    [branches, folders, subItems, persist]
  )

  const deleteTestStep = useCallback(
    (testCaseId: string, stepId: string) => {
      setTestCases(prev => {
        const next = prev.map(tc => {
          if (tc.id !== testCaseId) return tc
          const filtered = tc.steps.filter(s => s.id !== stepId)
          return { ...tc, steps: filtered.map((s, i) => ({ ...s, stepNumber: i + 1 })) }
        })
        persist(branches, folders, subItems, next)
        return next
      })
    },
    [branches, folders, subItems, persist]
  )

  return (
    <TestCasesContext.Provider
      value={{
        branches,
        selectedBranchId,
        setSelectedBranchId,
        addBranch,
        editBranch,
        deleteBranch,
        folders,
        selectedFolderId,
        setSelectedFolderId,
        editFolder,
        deleteFolder,
        subItems,
        selectedSubItemId,
        setSelectedSubItemId,
        addSubItem,
        editSubItem,
        deleteSubItem,
        testCases,
        addTestCase,
        editTestCase,
        deleteTestCase,
        addTestStep,
        editTestStep,
        deleteTestStep,
      }}
    >
      {children}
    </TestCasesContext.Provider>
  )
}

// ---------- Hook ----------

export function useTestCases(): TestCasesContextValue {
  const ctx = useContext(TestCasesContext)
  if (!ctx) throw new Error("useTestCases must be used within a TestCasesProvider")
  return ctx
}
