"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  useDocumentation,
  type Branch,
  type Document,
  type DocCategory,
  type DocSystem,
} from "@/lib/documentation-context"
import {
  Plus,
  GitBranch,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  FolderOpen,
  FileText,
  BookOpen,
  Wrench,
  Files,
  Download,
  ExternalLink,
  Upload,
} from "lucide-react"

const CATEGORIES: { id: DocCategory; name: string; icon: typeof BookOpen }[] = [
  { id: "run-book", name: "Run Book", icon: BookOpen },
  { id: "installation-guide", name: "Installation Guide", icon: Wrench },
  { id: "other-documents", name: "Other Documents", icon: Files },
]

const SYSTEMS: { id: DocSystem; name: string }[] = [
  { id: "ogw", name: "OGW" },
  { id: "o2a-sky", name: "O2A & SKY" },
]

export default function DocumentationPage() {
  const {
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
  } = useDocumentation()

  // Expanded states
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Dialog states
  const [branchDialogOpen, setBranchDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [branchName, setBranchName] = useState("")

  const [docDialogOpen, setDocDialogOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [docTitle, setDocTitle] = useState("")
  const [docDescription, setDocDescription] = useState("")
  const [docUrl, setDocUrl] = useState("")
  const [docFileName, setDocFileName] = useState("")
  const [docFileData, setDocFileData] = useState("")

  // Delete states
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null)
  const [deletingDoc, setDeletingDoc] = useState<Document | null>(null)

  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState(false)

  // Get current branch and documents
  const selectedBranch = branches.find(b => b.id === selectedBranchId)
  const currentDocs = selectedBranchId && selectedCategory && selectedSystem
    ? getDocuments(selectedBranchId, selectedCategory, selectedSystem)
    : []

  // Toggle functions
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

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryKey)) {
        next.delete(categoryKey)
      } else {
        next.add(categoryKey)
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

  // Document dialog handlers
  const openAddDocDialog = () => {
    if (!selectedBranchId || !selectedCategory || !selectedSystem) return
    setEditingDoc(null)
    setDocTitle("")
    setDocDescription("")
    setDocUrl("")
    setDocFileName("")
    setDocFileData("")
    setDocDialogOpen(true)
  }

  const openEditDocDialog = (doc: Document) => {
    setEditingDoc(doc)
    setDocTitle(doc.title)
    setDocDescription(doc.description || "")
    setDocUrl(doc.url || "")
    setDocFileName(doc.fileName || "")
    setDocFileData(doc.fileData || "")
    setDocDialogOpen(true)
  }

  const processFile = (file: File) => {
    setDocFileName(file.name)
    if (!docTitle.trim()) {
      setDocTitle(file.name.replace(/\.[^/.]+$/, ""))
    }
    const reader = new FileReader()
    reader.onload = () => {
      setDocFileData(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    if (docDialogOpen) {
      processFile(files[0])
    } else {
      if (!selectedBranchId || !selectedCategory || !selectedSystem) {
        return
      }
      const file = files[0]
      setEditingDoc(null)
      setDocTitle(file.name.replace(/\.[^/.]+$/, ""))
      setDocDescription("")
      setDocUrl("")
      setDocFileName("")
      setDocFileData("")
      setDocDialogOpen(true)

      const reader = new FileReader()
      reader.onload = () => {
        setDocFileName(file.name)
        setDocFileData(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const saveDoc = () => {
    if (!docTitle.trim()) return
    if (editingDoc) {
      editDocument(editingDoc.id, {
        title: docTitle.trim(),
        description: docDescription.trim() || undefined,
        url: docUrl.trim() || undefined,
        fileName: docFileName || undefined,
        fileData: docFileData || undefined,
      })
    } else if (selectedBranchId && selectedCategory && selectedSystem) {
      addDocument(
        selectedBranchId,
        selectedCategory,
        selectedSystem,
        docTitle.trim(),
        docDescription.trim() || undefined,
        docFileName || undefined,
        docFileData || undefined,
        docUrl.trim() || undefined
      )
    }
    setDocDialogOpen(false)
  }

  const downloadFile = (doc: Document) => {
    if (!doc.fileData || !doc.fileName) return
    const link = document.createElement("a")
    link.href = doc.fileData
    link.download = doc.fileName
    link.click()
  }

  // Get document count for a system
  const getDocCount = (branchId: string, category: DocCategory, system: DocSystem) => {
    return documents.filter(
      d => d.branchId === branchId && d.category === category && d.system === system
    ).length
  }

  // Get category name
  const getCategoryName = (cat: DocCategory) => {
    return CATEGORIES.find(c => c.id === cat)?.name || cat
  }

  // Get system name
  const getSystemName = (sys: DocSystem) => {
    return SYSTEMS.find(s => s.id === sys)?.name || sys
  }

  return (
    <div 
      className={`flex h-[calc(100vh-8rem)] relative ${isDragging ? "ring-2 ring-primary ring-dashed rounded-lg" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-primary pointer-events-none">
          <div className="text-center">
            <Upload className="h-12 w-12 mx-auto text-primary mb-3" />
            <p className="text-lg font-medium">Drop files here</p>
            <p className="text-sm text-muted-foreground mt-1">
              Documents, presentations, spreadsheets, videos and more
            </p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Documentation</h2>
          <Button size="sm" onClick={openAddBranchDialog}>
            <Plus className="h-4 w-4 mr-1" />
            Branch
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {branches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No branches yet</p>
              <Button variant="link" size="sm" onClick={openAddBranchDialog}>
                Add your first branch
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {branches.sort((a, b) => b.createdAt - a.createdAt).map(branch => {
                const isBranchExpanded = expandedBranches.has(branch.id)
                const isBranchSelected = selectedBranchId === branch.id

                return (
                  <div key={branch.id}>
                    {/* Branch Row */}
                    <div
                      className={cn(
                        "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group",
                        isBranchSelected && !selectedCategory ? "bg-primary/10" : "hover:bg-accent"
                      )}
                    >
                      <button
                        onClick={() => toggleBranch(branch.id)}
                        className="p-0.5 hover:bg-accent rounded"
                      >
                        {isBranchExpanded ? (
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
                          setSelectedCategory(null)
                          setSelectedSystem(null)
                          if (!isBranchExpanded) toggleBranch(branch.id)
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

                    {/* Categories under Branch */}
                    {isBranchExpanded && (
                      <div className="ml-5 mt-1 space-y-0.5">
                        {CATEGORIES.map(category => {
                          const categoryKey = `${branch.id}-${category.id}`
                          const isCategoryExpanded = expandedCategories.has(categoryKey)
                          const CategoryIcon = category.icon

                          return (
                            <div key={category.id}>
                              {/* Category Row */}
                              <div
                                className={cn(
                                  "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group",
                                  "hover:bg-accent"
                                )}
                              >
                                <button
                                  onClick={() => toggleCategory(categoryKey)}
                                  className="p-0.5 hover:bg-accent rounded"
                                >
                                  {isCategoryExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </button>
                                <CategoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span
                                  className="flex-1 text-sm truncate"
                                  onClick={() => {
                                    if (!isCategoryExpanded) toggleCategory(categoryKey)
                                  }}
                                >
                                  {category.name}
                                </span>
                              </div>

                              {/* Systems under Category */}
                              {isCategoryExpanded && (
                                <div className="ml-5 mt-1 space-y-0.5">
                                  {SYSTEMS.map(system => {
                                    const docCount = getDocCount(branch.id, category.id, system.id)
                                    const isSelected = 
                                      selectedBranchId === branch.id && 
                                      selectedCategory === category.id && 
                                      selectedSystem === system.id

                                    return (
                                      <div
                                        key={system.id}
                                        className={cn(
                                          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer",
                                          isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                                        )}
                                        onClick={() => {
                                          setSelectedBranchId(branch.id)
                                          setSelectedCategory(category.id)
                                          setSelectedSystem(system.id)
                                        }}
                                      >
                                        <FolderOpen className="h-3.5 w-3.5" />
                                        <span className="flex-1 text-sm">{system.name}</span>
                                        <Badge 
                                          variant="outline" 
                                          className={cn(
                                            "text-xs",
                                            isSelected && "border-primary-foreground/50"
                                          )}
                                        >
                                          {docCount}
                                        </Badge>
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
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selectedBranchId ? (
          <div className="text-center text-muted-foreground py-12">
            <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a branch from the sidebar to view documentation</p>
          </div>
        ) : !selectedCategory || !selectedSystem ? (
          <div className="text-center text-muted-foreground py-12">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a category and system to view documents</p>
            <p className="text-sm mt-2">
              Expand a branch, then select a document type (Run Book, Installation Guide, or Other Documents)
              and choose either OGW or O2A & SKY
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <span>{selectedBranch?.name}</span>
                  <ChevronRight className="h-4 w-4" />
                  <span>{getCategoryName(selectedCategory)}</span>
                  <ChevronRight className="h-4 w-4" />
                  <span>{getSystemName(selectedSystem)}</span>
                </div>
                <h2 className="text-xl font-semibold">
                  {getCategoryName(selectedCategory)} - {getSystemName(selectedSystem)}
                </h2>
              </div>
              <Button onClick={openAddDocDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            </div>

            {/* Documents List */}
            {currentDocs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Documents Yet</h3>
                  <p className="text-muted-foreground mb-1">
                    No delivery was done for {getSystemName(selectedSystem)} {getCategoryName(selectedCategory)} in this branch.
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add documents to track deliverables for {selectedBranch?.name}
                  </p>
                  <Button onClick={openAddDocDialog}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {currentDocs.sort((a, b) => b.createdAt - a.createdAt).map(doc => (
                  <Card key={doc.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">{doc.title}</h3>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {doc.fileName && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {doc.fileName}
                              </span>
                            )}
                            {doc.url && (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Open Link
                              </a>
                            )}
                            <span>
                              Added {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.fileData && (
                            <Button variant="outline" size="sm" onClick={() => downloadFile(doc)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {doc.url && (
                            <Button variant="outline" size="sm" onClick={() => window.open(doc.url, "_blank")}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDocDialog(doc)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeletingDoc(doc)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Branch Dialog */}
      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBranch ? "Edit Branch" : "Add Branch"}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Branch name (e.g., Release 2024.1)"
            value={branchName}
            onChange={e => setBranchName(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={saveBranch} disabled={!branchName.trim()}>
              {editingBranch ? "Save" : "Create Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Dialog */}
      <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDoc ? "Edit Document" : "Add Document"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title *</label>
              <Input
                placeholder="Document title..."
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea
                placeholder="Brief description..."
                value={docDescription}
                onChange={e => setDocDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">URL (optional)</label>
              <Input
                placeholder="https://..."
                value={docUrl}
                onChange={e => setDocUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Or Upload File</label>
              <div 
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  docFileName ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const file = e.dataTransfer.files[0]
                  if (file) processFile(file)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                {docFileName ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">{docFileName}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => { setDocFileName(""); setDocFileData("") }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop a file here, or <span className="text-primary underline">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, Word, Excel, PowerPoint, videos, and more
                    </p>
                    <Input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDoc} disabled={!docTitle.trim()}>
              {editingDoc ? "Save Changes" : "Add Document"}
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
              Are you sure you want to delete "{deletingBranch?.name}"? This will also delete all documents under this branch.
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

      {/* Delete Document Confirmation */}
      <AlertDialog open={!!deletingDoc} onOpenChange={() => setDeletingDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingDoc?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingDoc) deleteDocument(deletingDoc.id)
                setDeletingDoc(null)
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
