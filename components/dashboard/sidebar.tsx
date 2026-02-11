"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Play,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  Bot,
  BookOpen,
  FolderArchive,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Test Runner", href: "/runner", icon: Play },
  { name: "AI Chat", href: "/chat", icon: MessageSquare },
  { name: "Test Cases", href: "/test-cases", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Progress Calculation", href: "/progress-calculation", icon: BarChart3 },
  { name: "Project KT", href: "/project-kt", icon: BookOpen },
  { name: "Documentation", href: "/documentation", icon: FolderArchive },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">Autonation</span>
          <span className="text-xs text-muted-foreground">Testing AI</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
