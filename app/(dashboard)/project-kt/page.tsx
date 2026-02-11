"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  FileText,
  Video,
  Link as LinkIcon,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  Download,
  BookOpen,
  FolderOpen,
  Search,
  Upload,
} from "lucide-react"

const STORAGE_KEY = "projectKTResources"

type ResourceType = "document" | "video" | "link"

interface KTResource {
  id: string
  type: ResourceType
  title: string
  description: string
  url?: string
  fileName?: string
  fileData?: string // base64 for uploaded files
  createdAt: number
  updatedAt: number
}

function loadResources(): KTResource[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveResources(resources: KTResource[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resources))
}

export default function ProjectKTPage() {
  const [resources, setResources] = useState<KTResource[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<KTResource | null>(null)
  const [deletingResource, setDeletingResource] = useState<KTResource | null>(null)

  // Form state
  const [resourceType, setResourceType] = useState<ResourceType>("document")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [url, setUrl] = useState("")
  const [fileName, setFileName] = useState("")
  const [fileData, setFileData] = useState("")

// Filter state
  const [filterType, setFilterType] = useState<ResourceType | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    setResources(loadResources())
  }, [])

const filteredResources = resources.filter(r => {
    const matchesType = filterType === "all" || r.type === filterType
    const matchesSearch = searchQuery === "" || 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const documents = resources.filter(r => r.type === "document")
  const videos = resources.filter(r => r.type === "video")
  const links = resources.filter(r => r.type === "link")

  const openAddDialog = (type: ResourceType) => {
    setEditingResource(null)
    setResourceType(type)
    setTitle("")
    setDescription("")
    setUrl("")
    setFileName("")
    setFileData("")
    setIsDialogOpen(true)
  }

  const openEditDialog = (resource: KTResource) => {
    setEditingResource(resource)
    setResourceType(resource.type)
    setTitle(resource.title)
    setDescription(resource.description)
    setUrl(resource.url || "")
    setFileName(resource.fileName || "")
    setFileData(resource.fileData || "")
    setIsDialogOpen(true)
  }

  const processFile = (file: File) => {
    setFileName(file.name)
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""))
    }
    const reader = new FileReader()
    reader.onload = () => {
      setFileData(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  const getFileResourceType = (file: File): ResourceType => {
    if (file.type.startsWith("video/")) return "video"
    return "document"
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    if (isDialogOpen) {
      // If dialog is open, add to current form
      processFile(files[0])
    } else {
      // If dialog is closed, auto-open dialog for each file
      const file = files[0]
      const type = getFileResourceType(file)
      setEditingResource(null)
      setResourceType(type)
      setTitle(file.name.replace(/\.[^/.]+$/, ""))
      setDescription("")
      setUrl("")
      setFileName("")
      setFileData("")
      setIsDialogOpen(true)

      // Process file after dialog state is set
      const reader = new FileReader()
      reader.onload = () => {
        setFileName(file.name)
        setFileData(reader.result as string)
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
    // Only set false if we're leaving the container (not entering a child)
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const saveResource = () => {
    if (!title.trim()) return

    const now = Date.now()
    
    if (editingResource) {
      const updated = resources.map(r => 
        r.id === editingResource.id 
          ? { 
              ...r, 
              title: title.trim(), 
              description: description.trim(),
              url: url.trim() || undefined,
              fileName: fileName || undefined,
              fileData: fileData || undefined,
              updatedAt: now 
            }
          : r
      )
      setResources(updated)
      saveResources(updated)
    } else {
      const newResource: KTResource = {
        id: `kt-${now}`,
        type: resourceType,
        title: title.trim(),
        description: description.trim(),
        url: url.trim() || undefined,
        fileName: fileName || undefined,
        fileData: fileData || undefined,
        createdAt: now,
        updatedAt: now,
      }
      const updated = [newResource, ...resources]
      setResources(updated)
      saveResources(updated)
    }
    
    setIsDialogOpen(false)
  }

  const deleteResource = (id: string) => {
    const updated = resources.filter(r => r.id !== id)
    setResources(updated)
    saveResources(updated)
    setDeletingResource(null)
  }

  const downloadFile = (resource: KTResource) => {
    if (!resource.fileData || !resource.fileName) return
    
    const link = document.createElement("a")
    link.href = resource.fileData
    link.download = resource.fileName
    link.click()
  }

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case "document": return <FileText className="h-5 w-5" />
      case "video": return <Video className="h-5 w-5" />
      case "link": return <LinkIcon className="h-5 w-5" />
    }
  }

  const getTypeBadgeColor = (type: ResourceType) => {
    switch (type) {
      case "document": return "bg-blue-600"
      case "video": return "bg-purple-600"
      case "link": return "bg-green-600"
    }
  }

  return (
    <div 
      className={`space-y-6 relative min-h-[50vh] ${isDragging ? "ring-2 ring-primary ring-dashed rounded-lg" : ""}`}
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
              Documents, videos, presentations, spreadsheets and more
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Knowledge Transfer</h1>
          <p className="text-muted-foreground mt-1">
            Central repository for project documentation, training videos, and useful resources
          </p>
        </div>
      </div>

      {/* Add Resource */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Add Resource:</span>
        <Button 
          size="sm"
          onClick={() => openAddDialog("document")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <FileText className="mr-1.5 h-4 w-4" />
          Document
        </Button>
        <Button 
          size="sm"
          onClick={() => openAddDialog("video")}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Video className="mr-1.5 h-4 w-4" />
          Video
        </Button>
        <Button 
          size="sm"
          onClick={() => openAddDialog("link")}
          className="bg-green-600 hover:bg-green-700"
        >
          <LinkIcon className="mr-1.5 h-4 w-4" />
          Link
        </Button>
      </div>

{/* Search Card */}
      <Card>
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents, videos, and links..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button 
          variant={filterType === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("all")}
        >
          All ({resources.length})
        </Button>
        <Button 
          variant={filterType === "document" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("document")}
        >
          <FileText className="mr-1 h-3 w-3" />
          Documents ({documents.length})
        </Button>
        <Button 
          variant={filterType === "video" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("video")}
        >
          <Video className="mr-1 h-3 w-3" />
          Videos ({videos.length})
        </Button>
        <Button 
          variant={filterType === "link" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("link")}
        >
          <LinkIcon className="mr-1 h-3 w-3" />
          Links ({links.length})
        </Button>
      </div>

      {/* Resources List */}
      {filteredResources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Resources Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your knowledge base by adding documents, videos, or useful links
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => openAddDialog("document")}>
                <FileText className="mr-1 h-3 w-3" />
                Add Document
              </Button>
              <Button variant="outline" size="sm" onClick={() => openAddDialog("video")}>
                <Video className="mr-1 h-3 w-3" />
                Add Video
              </Button>
              <Button variant="outline" size="sm" onClick={() => openAddDialog("link")}>
                <LinkIcon className="mr-1 h-3 w-3" />
                Add Link
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredResources.sort((a, b) => b.createdAt - a.createdAt).map(resource => (
            <Card key={resource.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getTypeBadgeColor(resource.type)}/20`}>
                    {getTypeIcon(resource.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{resource.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {resource.type === "document" ? "Document" : 
                         resource.type === "video" ? "Video" : "Link"}
                      </Badge>
                    </div>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {resource.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {resource.fileName && (
                        <span className="flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          {resource.fileName}
                        </span>
                      )}
                      {resource.url && (
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open Link
                        </a>
                      )}
                      <span>
                        Added {new Date(resource.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {resource.fileData && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadFile(resource)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {resource.url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(resource.url, "_blank")}
                      >
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
                        <DropdownMenuItem onClick={() => openEditDialog(resource)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeletingResource(resource)}
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? "Edit" : "Add"} {resourceType === "document" ? "Document" : resourceType === "video" ? "Video" : "Link"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title *</label>
              <Input
                placeholder="Enter title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea
                placeholder="Enter description..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            {resourceType === "link" ? (
              <div>
                <label className="text-sm font-medium mb-1.5 block">URL *</label>
                <Input
                  placeholder="https://..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {resourceType === "video" ? "Video URL (YouTube, Vimeo, etc.)" : "Document URL (optional)"}
                  </label>
                  <Input
                    placeholder="https://..."
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Or Upload File</label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      fileName ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
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
                    {fileName ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm">{fileName}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          onClick={() => { setFileName(""); setFileData("") }}
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
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveResource}
              disabled={!title.trim() || (resourceType === "link" && !url.trim())}
            >
              {editingResource ? "Save Changes" : "Add Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingResource} onOpenChange={() => setDeletingResource(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingResource?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingResource && deleteResource(deletingResource.id)}
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
