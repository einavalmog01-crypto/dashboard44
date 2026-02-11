"use client"

import { DocumentationProvider } from "@/lib/documentation-context"

export default function DocumentationLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocumentationProvider>
      {children}
    </DocumentationProvider>
  )
}
