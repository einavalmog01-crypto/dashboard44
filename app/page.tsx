"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentTests } from "@/components/dashboard/recent-tests"
import { Button } from "@/components/ui/button"
import { Play, CheckCircle, XCircle, ListChecks } from "lucide-react"
import type { SanityReport } from "@/lib/sanity-reports"

interface DashboardStats {
  totalTests: number
  passed: number
  failed: number
  passRate: string
  suiteStats: {
    name: string
    passed: number
    total: number
    percentage: number
  }[]
}

function calculateStats(reports: SanityReport[]): DashboardStats {
  let totalTests = 0
  let passed = 0
  let failed = 0

  const suiteMap: Record<string, { passed: number; total: number }> = {
    "BASIC": { passed: 0, total: 0 },
    "SELECTED": { passed: 0, total: 0 },
    "SCHEDULED": { passed: 0, total: 0 },
  }

  for (const report of reports) {
    for (const test of report.tests) {
      totalTests++
      if (test.status === "PASS") {
        passed++
        if (suiteMap[report.type]) {
          suiteMap[report.type].passed++
        }
      } else {
        failed++
      }
      if (suiteMap[report.type]) {
        suiteMap[report.type].total++
      }
    }
  }

  const passRate = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : "0.0"

  const suiteStats = Object.entries(suiteMap)
    .filter(([_, data]) => data.total > 0)
    .map(([name, data]) => ({
      name: name === "BASIC" ? "Basic Sanity" : 
            name === "SELECTED" ? "Selected Tests" : "Scheduled Tests",
      passed: data.passed,
      total: data.total,
      percentage: data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0,
    }))

  return { totalTests, passed, failed, passRate, suiteStats }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTests: 0,
    passed: 0,
    failed: 0,
    passRate: "0.0",
    suiteStats: [],
  })

  useEffect(() => {
    // Load reports from localStorage
    const raw = localStorage.getItem("sanityReports")
    const reports: SanityReport[] = raw ? JSON.parse(raw) : []
    setStats(calculateStats(reports))
  }, [])

  return (
    <DashboardLayout
      title="Dashboard"
      description="Overview of your testing automation"
    >
      <div className="space-y-6">

        <div className="flex items-center justify-between">
          <div />
          <Button asChild>
            <Link href="/runner">
              <Play className="h-4 w-4 mr-2" />
              Go to Test Runner
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Tests"
            value={stats.totalTests}
            change={`${stats.suiteStats.length} test suites run`}
            changeType="neutral"
            icon={Play}
          />
          <StatsCard
            title="Passed"
            value={stats.passed}
            change={`${stats.passRate}% pass rate`}
            changeType={parseFloat(stats.passRate) >= 80 ? "positive" : "negative"}
            icon={CheckCircle}
          />
          <StatsCard
            title="Failed"
            value={stats.failed}
            change={stats.totalTests > 0 ? `${((stats.failed / stats.totalTests) * 100).toFixed(1)}% fail rate` : "No tests run"}
            changeType={stats.failed === 0 ? "positive" : "negative"}
            icon={XCircle}
          />
          <StatsCard
            title="Test Suites"
            value={stats.suiteStats.length}
            change="Types of tests run"
            changeType="neutral"
            icon={ListChecks}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentTests />
          <TestSuiteStatus suiteStats={stats.suiteStats} />
        </div>
      </div>
    </DashboardLayout>
  )
}

function TestSuiteStatus({ suiteStats }: { suiteStats: DashboardStats["suiteStats"] }) {
  if (suiteStats.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Test Suite Status</h3>
        <p className="text-muted-foreground text-sm">No tests have been run yet. Go to Test Runner to execute tests.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Test Suite Status</h3>
      <div className="space-y-4">
        {suiteStats.map((suite) => (
          <div key={suite.name}>
            <div className="flex justify-between text-sm">
              <span>{suite.name}</span>
              <span>{suite.passed}/{suite.total}</span>
            </div>
            <div className="h-2 bg-secondary rounded">
              <div
                className={`h-full rounded ${suite.percentage >= 80 ? "bg-green-500" : suite.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${suite.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
