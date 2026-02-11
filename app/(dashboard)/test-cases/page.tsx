"use client"

import { useState, useMemo } from "react"
import { useTestCases, type Branch, type Folder, type SubItem, type TestCase } from "@/lib/test-cases-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  MoreVertical, 
  Search, 
  ChevronRight, 
  ChevronDown,
  FileText,
  GitBranch,
  FolderOpen,
  Trash2,
  Pencil,
  X,
  Paperclip
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Re-export for backwards compatibility
export type { Branch } from "@/lib/test-cases-context"

export default function TestCasesPage() {
  const {
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
  } = useTestCases()

  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [branchDialogOpen, setBranchDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [branchName, setBranchName] = useState("")

  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [folderName, setFolderName] = useState("")

  const [subItemDialogOpen, setSubItemDialogOpen] = useState(false)
  const [editingSubItem, setEditingSubItem] = useState<SubItem | null>(null)
  const [subItemType, setSubItemType] = useState<"user-story" | "cr">("user-story")
  const [subItemName, setSubItemName] = useState("")
  const [subItemDescription, setSubItemDescription] = useState("")
  const [addingSubItemToFolderId, setAddingSubItemToFolderId] = useState<string | null>(null)

  const [testCaseDialogOpen, setTestCaseDialogOpen] = useState(false)
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null)
  const [testCaseName, setTestCaseName] = useState("")

  const [stepDialogOpen, setStepDialogOpen] = useState(false)
  const [editingStepTestCaseId, setEditingStepTestCaseId] = useState<string | null>(null)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [stepDescription, setStepDescription] = useState("")
  const [stepExpectedResult, setStepExpectedResult] = useState("")

  // Delete confirmation states
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null)
  const [deletingSubItem, setDeletingSubItem] = useState<SubItem | null>(null)
  const [deletingTestCase, setDeletingTestCase] = useState<TestCase | null>(null)

  // Expanded branches, folders, and test cases state
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set())
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [expandedTestCases, setExpandedTestCases] = useState<Set<string>>(new Set())

  // Selected branch and folder data
  const selectedBranch = branches.find(b => b.id === selectedBranchId)
  const selectedFolder = folders.find(f => f.id === selectedFolderId)
  const branchFolders = useMemo(() => 
    folders.filter(f => f.branchId === selectedBranchId),
    [folders, selectedBranchId]
  )
  const folderSubItems = useMemo(() => 
    subItems.filter(s => s.folderId === selectedFolderId),
    [subItems, selectedFolderId]
  )

  // Filtered sub-items based on search
  const filteredSubItems = useMemo(() => {
    if (!searchQuery) return folderSubItems
    return folderSubItems.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [folderSubItems, searchQuery])

  // Selected sub-item data
  const selectedSubItem = subItems.find(s => s.id === selectedSubItemId)
  const subItemTestCases = useMemo(() =>
    testCases.filter(t => t.subItemId === selectedSubItemId),
    [testCases, selectedSubItemId]
  )

  // Toggle branch expansion
  const toggleBranch = (branchId: string) => {
    setExpandedBranches(prev => {
      const next = new Set(prev)
      if (next.has(branchId)) {
        next.delete(branchId)
      } else {
        next.add(branchId)
      }
      return next
    })
  }

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  // Toggle test case expansion
  const toggleTestCase = (testCaseId: string) => {
    setExpandedTestCases(prev => {
      const next = new Set(prev)
      if (next.has(testCaseId)) {
        next.delete(testCaseId)
      } else {
        next.add(testCaseId)
      }
      return next
    })
  }

  // Branch dialog handlers
  const openAddBranchDialog = () => {
    setEditingBranch(null)
    setBranchName("")
    setBranchDialogOpen(true)
  }

  const openEditBranchDialog = (branch: Branch) => {
    setEditingBranch(branch)
    setBranchName(branch.name)
    setBranchDialogOpen(true)
  }

  const saveBranch = () => {
    if (!branchName.trim()) return
    if (editingBranch) {
      editBranch(editingBranch.id, branchName.trim())
    } else {
      addBranch(branchName.trim())
    }
    setBranchDialogOpen(false)
  }

  // Folder dialog handlers
  const openEditFolderDialog = (folder: Folder) => {
    setEditingFolder(folder)
    setFolderName(folder.name)
    setFolderDialogOpen(true)
  }

  const saveFolder = () => {
    if (!folderName.trim() || !editingFolder) return
    editFolder(editingFolder.id, folderName.trim())
    setFolderDialogOpen(false)
  }

  // Sub-item dialog handlers
  const openAddSubItemDialog = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return
    setEditingSubItem(null)
    setAddingSubItemToFolderId(folderId)
    // Determine type based on folder
    setSubItemType(folder.type === "us" ? "user-story" : "cr")
    setSubItemName("")
    setSubItemDescription("")
    setSubItemDialogOpen(true)
  }

  const openEditSubItemDialog = (subItem: SubItem) => {
    setEditingSubItem(subItem)
    setAddingSubItemToFolderId(null)
    setSubItemType(subItem.type)
    setSubItemName(subItem.name)
    setSubItemDescription(subItem.description || "")
    setSubItemDialogOpen(true)
  }

  const saveSubItem = () => {
    if (!subItemName.trim()) return
    if (editingSubItem) {
      editSubItem(editingSubItem.id, subItemName.trim(), subItemDescription.trim() || undefined)
    } else if (addingSubItemToFolderId) {
      addSubItem(addingSubItemToFolderId, subItemType, subItemName.trim(), subItemDescription.trim() || undefined)
    }
    setSubItemDialogOpen(false)
  }

  // Test case dialog handlers
  const openAddTestCaseDialog = () => {
    setEditingTestCase(null)
    setTestCaseName("")
    setTestCaseDialogOpen(true)
  }

  const openEditTestCaseDialog = (tc: TestCase) => {
    setEditingTestCase(tc)
    setTestCaseName(tc.name)
    setTestCaseDialogOpen(true)
  }

  const saveTestCase = () => {
    if (!testCaseName.trim() || !selectedSubItemId) return
    if (editingTestCase) {
      editTestCase(editingTestCase.id, { name: testCaseName.trim() })
    } else {
      addTestCase(selectedSubItemId, testCaseName.trim())
    }
    setTestCaseDialogOpen(false)
  }

  // Step dialog handlers
  const openAddStepDialog = (testCaseId: string) => {
    setEditingStepTestCaseId(testCaseId)
    setEditingStepId(null)
    setStepDescription("")
    setStepExpectedResult("")
    setStepDialogOpen(true)
  }

  const openEditStepDialog = (testCaseId: string, stepId: string, description: string, expectedResult: string) => {
    setEditingStepTestCaseId(testCaseId)
    setEditingStepId(stepId)
    setStepDescription(description)
    setStepExpectedResult(expectedResult)
    setStepDialogOpen(true)
  }

  const saveStep = () => {
    if (!stepDescription.trim() || !editingStepTestCaseId) return
    if (editingStepId) {
      editTestStep(editingStepTestCaseId, editingStepId, stepDescription.trim(), stepExpectedResult.trim())
    } else {
      addTestStep(editingStepTestCaseId, stepDescription.trim(), stepExpectedResult.trim())
    }
    setStepDialogOpen(false)
  }

  // Handle file attachment for test case
  const handleAttachment = (testCaseId: string, file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const tc = testCases.find(t => t.id === testCaseId)
      if (tc) {
        editTestCase(testCaseId, {
          attachments: [...tc.attachments, { name: file.name, url: dataUrl }]
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const removeAttachment = (testCaseId: string, idx: number) => {
    const tc = testCases.find(t => t.id === testCaseId)
    if (tc) {
      editTestCase(testCaseId, {
        attachments: tc.attachments.filter((_, i) => i !== idx)
      })
    }
  }

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Branches Bar */}
      <aside className="w-72 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Branches</h2>
            <Button size="icon" variant="ghost" onClick={openAddBranchDialog}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {branches.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">No branches yet. Add one to get started.</p>
          ) : (
            <div className="space-y-1">
              {branches.sort((a, b) => b.createdAt - a.createdAt).map(branch => {
                const isExpanded = expandedBranches.has(branch.id)
                const isSelected = selectedBranchId === branch.id
                const branchFoldersList = folders.filter(f => f.branchId === branch.id)

                return (
                  <div key={branch.id}>
                    <div
                      className={cn(
                        "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group",
                        isSelected && !selectedFolderId ? "bg-primary/10" : "hover:bg-accent"
                      )}
                    >
                      <button
                        onClick={() => toggleBranch(branch.id)}
                        className="p-0.5 hover:bg-accent rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <span
                        className="flex-1 text-sm truncate"
                        onClick={() => {
                          setSelectedBranchId(branch.id)
                          setSelectedFolderId(null)
                          setSelectedSubItemId(null)
                          if (!isExpanded) toggleBranch(branch.id)
                        }}
                      >
                        {branch.name}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditBranchDialog(branch)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingBranch(branch)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Folders under branch (US and CRs/SRs) */}
                    {isExpanded && (
                      <div className="ml-6 mt-1 space-y-0.5">
                        {branchFoldersList.map(folder => {
                          const isFolderExpanded = expandedFolders.has(folder.id)
                          const isFolderSelected = selectedFolderId === folder.id
                          const folderItems = subItems.filter(s => s.folderId === folder.id)

                          return (
                            <div key={folder.id}>
                              <div
                                className={cn(
                                  "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group",
                                  isFolderSelected ? "bg-primary/10" : "hover:bg-accent"
                                )}
                              >
                                <button
                                  onClick={() => toggleFolder(folder.id)}
                                  className="p-0.5 hover:bg-accent rounded"
                                >
                                  {isFolderExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </button>
                                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                <span
                                  className="flex-1 text-sm truncate"
                                  onClick={() => {
                                    setSelectedBranchId(branch.id)
                                    setSelectedFolderId(folder.id)
                                    setSelectedSubItemId(null)
                                    if (!isFolderExpanded) toggleFolder(folder.id)
                                  }}
                                >
                                  {folder.name}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {folderItems.length}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 opacity-0 group-hover:opacity-100"
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEditFolderDialog(folder)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openAddSubItemDialog(folder.id)}>
                                      <Plus className="mr-2 h-4 w-4" />
                                      Add {folder.type === "us" ? "User Story" : "CR/SR"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => setDeletingFolder(folder)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Remove
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Items under folder */}
                              {isFolderExpanded && (
                                <div className="ml-6 mt-1 space-y-0.5">
                                  {folderItems.length === 0 ? (
                                    <p className="text-xs text-muted-foreground pl-4 py-1">No items</p>
                                  ) : (
                                    folderItems.map(item => (
                                      <div
                                        key={item.id}
                                        className={cn(
                                          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group",
                                          selectedSubItemId === item.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                                        )}
                                        onClick={() => {
                                          setSelectedBranchId(branch.id)
                                          setSelectedFolderId(folder.id)
                                          setSelectedSubItemId(item.id)
                                        }}
                                      >
                                        <FileText className="h-3.5 w-3.5" />
                                        <span className="flex-1 text-sm truncate">{item.name}</span>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className={cn(
                                                "h-5 w-5 opacity-0 group-hover:opacity-100",
                                                selectedSubItemId === item.id && "text-primary-foreground"
                                              )}
                                            >
                                              <MoreVertical className="h-3 w-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditSubItemDialog(item)}>
                                              <Pencil className="mr-2 h-4 w-4" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              className="text-destructive"
                                              onClick={() => setDeletingSubItem(item)}
                                            >
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Remove
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header with search */}
        <div className="p-4 border-b flex items-center gap-4">
          <h1 className="text-xl font-semibold">Test Cases</h1>
          {selectedBranchId && (
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search User Story / CR..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedBranchId ? (
            <div className="text-center text-muted-foreground py-12">
              <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a branch from the sidebar to view its test cases</p>
            </div>
          ) : !selectedFolderId ? (
            <div className="text-center text-muted-foreground py-12">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a folder (US or CRs/SRs) from the sidebar</p>
            </div>
          ) : !selectedSubItemId ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">
                  {selectedBranch?.name} / {selectedFolder?.name}
                </h2>
                <Button onClick={() => openAddSubItemDialog(selectedFolderId)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add {selectedFolder?.type === "us" ? "User Story" : "CR/SR"}
                </Button>
              </div>

              {filteredSubItems.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 border rounded-lg">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{searchQuery ? "No matching items found" : `No ${selectedFolder?.type === "us" ? "User Stories" : "CRs/SRs"} yet`}</p>
                  <Button className="mt-4" onClick={() => openAddSubItemDialog(selectedFolderId)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add {selectedFolder?.type === "us" ? "User Story" : "CR/SR"}
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredSubItems.map(item => (
                    <div
                      key={item.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition"
                      onClick={() => setSelectedSubItemId(item.id)}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.name}</span>
                            <Badge variant={item.type === "user-story" ? "default" : "secondary"}>
                              {item.type === "user-story" ? "User Story" : "CR/SR"}
                            </Badge>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Test Cases View */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSubItemId(null)}>
                    Back
                  </Button>
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <h2 className="text-lg font-medium">{selectedSubItem?.name}</h2>
                      <Badge variant={selectedSubItem?.type === "user-story" ? "default" : "secondary"}>
                        {selectedSubItem?.type === "user-story" ? "User Story" : "CR/SR"}
                      </Badge>
                    </div>
                    {selectedSubItem?.description && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedSubItem.description}</p>
                    )}
                  </div>
                </div>
                <Button onClick={openAddTestCaseDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Test Case
                </Button>
              </div>

              {subItemTestCases.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 border rounded-lg">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No test cases yet</p>
                  <Button className="mt-4" onClick={openAddTestCaseDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Test Case
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {subItemTestCases.map((tc, idx) => {
                    const isExpanded = expandedTestCases.has(tc.id)
                    return (
                    <div key={tc.id} className="border rounded-lg overflow-hidden">
                      {/* Collapsed Header - Always visible */}
                      <div 
                        className={cn(
                          "p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors",
                          isExpanded && "border-b bg-muted/30"
                        )}
                        onClick={() => toggleTestCase(tc.id)}
                      >
                        <div className="flex items-center gap-3">
                          <button className="p-0.5">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          <span className="font-medium">Test {idx + 1} - {tc.name}</span>
                          <Badge
                            variant={
                              tc.status === "pass" ? "default" :
                              tc.status === "fail" ? "destructive" : "secondary"
                            }
                            className={tc.status === "pass" ? "bg-green-600" : ""}
                          >
                            {tc.status.charAt(0).toUpperCase() + tc.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <Button variant="outline" size="sm" onClick={() => openEditTestCaseDialog(tc)}>
                            <Pencil className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeletingTestCase(tc)}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Remove
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                      <div className="p-4 space-y-4">
                        {/* Steps Table */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium">Steps</h4>
                            <Button size="sm" variant="outline" onClick={() => openAddStepDialog(tc.id)}>
                              <Plus className="mr-1 h-3 w-3" />
                              Add Step
                            </Button>
                          </div>
                          {tc.steps.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No steps defined</p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-16">#</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead>Expected Result</TableHead>
                                  <TableHead className="w-24">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {tc.steps.map(step => (
                                  <TableRow key={step.id}>
                                    <TableCell>{step.stepNumber}</TableCell>
                                    <TableCell>{step.description}</TableCell>
                                    <TableCell>{step.expectedResult}</TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => openEditStepDialog(tc.id, step.id, step.description, step.expectedResult)}
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-destructive"
                                          onClick={() => deleteTestStep(tc.id, step.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>

                        {/* Status */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Status</h4>
                          <Select
                            value={tc.status}
                            onValueChange={(value: "pending" | "pass" | "fail") => 
                              editTestCase(tc.id, { status: value })
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="pass">Pass</SelectItem>
                              <SelectItem value="fail">Fail</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Attachments */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Evidence Attachments</h4>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {tc.attachments.map((att, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md text-sm">
                                <Paperclip className="h-3 w-3" />
                                <a
                                  href={att.url}
                                  download={att.name}
                                  className="text-blue-600 hover:underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {att.name}
                                </a>
                                <button
                                  onClick={() => removeAttachment(tc.id, idx)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <Input
                            type="file"
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleAttachment(tc.id, file)
                                e.target.value = ""
                              }
                            }}
                          />
                        </div>

                        {/* Comment */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Comment</h4>
                          <Textarea
                            placeholder="Add a comment..."
                            value={tc.comment}
                            onChange={e => editTestCase(tc.id, { comment: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                      )}
                    </div>
                  )})}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Branch Dialog */}
      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBranch ? "Edit Branch" : "Add Branch"}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Branch name (e.g. Wave 12)"
            value={branchName}
            onChange={e => setBranchName(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={saveBranch} disabled={!branchName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder Dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={folderName}
            onChange={e => setFolderName(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={saveFolder} disabled={!folderName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-Item Dialog */}
      <Dialog open={subItemDialogOpen} onOpenChange={setSubItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubItem ? `Edit ${editingSubItem.type === "user-story" ? "User Story" : "CR"}` : `Add ${subItemType === "user-story" ? "User Story" : "CR"}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={subItemType === "user-story" ? "e.g. US-12345" : "e.g. CR-67890"}
              value={subItemName}
              onChange={e => setSubItemName(e.target.value)}
            />
            <Textarea
              placeholder="Description (optional)"
              value={subItemDescription}
              onChange={e => setSubItemDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button onClick={saveSubItem} disabled={!subItemName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Case Dialog */}
      <Dialog open={testCaseDialogOpen} onOpenChange={setTestCaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTestCase ? "Edit Test Case" : "Add Test Case"}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Test case name"
            value={testCaseName}
            onChange={e => setTestCaseName(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={saveTestCase} disabled={!testCaseName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step Dialog */}
      <Dialog open={stepDialogOpen} onOpenChange={setStepDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStepId ? "Edit Step" : "Add Step"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Step description"
                value={stepDescription}
                onChange={e => setStepDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Expected Result</label>
              <Textarea
                placeholder="Expected result"
                value={stepExpectedResult}
                onChange={e => setStepExpectedResult(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveStep} disabled={!stepDescription.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Confirmation */}
      <AlertDialog open={!!deletingBranch} onOpenChange={() => setDeletingBranch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingBranch?.name}"? This will also delete all User Stories, CRs, and Test Cases under this branch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingBranch) deleteBranch(deletingBranch.id)
                setDeletingBranch(null)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Folder Confirmation */}
      <AlertDialog open={!!deletingFolder} onOpenChange={() => setDeletingFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingFolder?.name}"? This will also delete all items and Test Cases under this folder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingFolder) deleteFolder(deletingFolder.id)
                setDeletingFolder(null)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Sub-Item Confirmation */}
      <AlertDialog open={!!deletingSubItem} onOpenChange={() => setDeletingSubItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingSubItem?.type === "user-story" ? "User Story" : "CR"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSubItem?.name}"? This will also delete all Test Cases under this item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingSubItem) deleteSubItem(deletingSubItem.id)
                setDeletingSubItem(null)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Test Case Confirmation */}
      <AlertDialog open={!!deletingTestCase} onOpenChange={() => setDeletingTestCase(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTestCase?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingTestCase) deleteTestCase(deletingTestCase.id)
                setDeletingTestCase(null)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
