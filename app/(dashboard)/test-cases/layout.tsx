"use client"

import { TestCasesProvider } from "@/lib/test-cases-context"

export default function TestCasesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TestCasesProvider>
      <div className="h-full">
        {children}
      </div>
    </TestCasesProvider>
  )
}
