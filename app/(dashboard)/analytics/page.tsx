"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { SanityReport } from "@/lib/sanity-reports";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

interface AnalyticsData {
  stats: {
    totalRuns: number;
    passRate: number;
    testsExecuted: number;
    environments: number;
  };
  passRateData: { date: string; passed: number; failed: number }[];
  executionByEnv: { env: string; count: number }[];
  testDistribution: { name: string; value: number; color: string }[];
  recentRuns: {
    id: string;
    type: string;
    environment: string;
    status: "passed" | "failed";
    tests: { passed: number; failed: number };
    timestamp: string;
  }[];
  topFailures: { test: string; type: string; failures: number }[];
}

function calculateAnalytics(reports: SanityReport[]): AnalyticsData {
  const stats = {
    totalRuns: reports.length,
    passRate: 0,
    testsExecuted: 0,
    environments: 0,
  };

  let totalPassed = 0;
  let totalFailed = 0;
  const envSet = new Set<string>();
  const failureMap: Record<string, { type: string; count: number }> = {};
  const dateMap: Record<string, { passed: number; failed: number }> = {};
  const envCountMap: Record<string, number> = {};

  for (const report of reports) {
    envSet.add(report.environment || "Unknown");
    envCountMap[report.environment || "Unknown"] = (envCountMap[report.environment || "Unknown"] || 0) + 1;

    const reportDate = new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!dateMap[reportDate]) {
      dateMap[reportDate] = { passed: 0, failed: 0 };
    }

    for (const test of report.tests) {
      stats.testsExecuted++;
      if (test.status === "PASS") {
        totalPassed++;
        dateMap[reportDate].passed++;
      } else {
        totalFailed++;
        dateMap[reportDate].failed++;
        // Track failures
        const key = test.testName;
        if (!failureMap[key]) {
          failureMap[key] = { type: report.type, count: 0 };
        }
        failureMap[key].count++;
      }
    }
  }

  stats.passRate = stats.testsExecuted > 0 ? parseFloat(((totalPassed / stats.testsExecuted) * 100).toFixed(1)) : 0;
  stats.environments = envSet.size;

  // Pass rate data (last 7 dates)
  const passRateData = Object.entries(dateMap)
    .map(([date, data]) => ({ date, passed: data.passed, failed: data.failed }))
    .slice(-7);

  // Execution by environment
  const executionByEnv = Object.entries(envCountMap)
    .map(([env, count]) => ({ env, count }))
    .sort((a, b) => b.count - a.count);

  // Test distribution
  const testDistribution = [
    { name: "Passed", value: totalPassed, color: "#22c55e" },
    { name: "Failed", value: totalFailed, color: "#ef4444" },
  ].filter(d => d.value > 0);

  // Recent runs
  const recentRuns = reports.slice(0, 10).map(report => {
    const passed = report.tests.filter(t => t.status === "PASS").length;
    const failed = report.tests.filter(t => t.status === "FAILED").length;
    return {
      id: report.id.slice(0, 8).toUpperCase(),
      type: report.type,
      environment: report.environment || "Unknown",
      status: (failed === 0 ? "passed" : "failed") as "passed" | "failed",
      tests: { passed, failed },
      timestamp: formatTimeAgo(report.createdAt),
    };
  });

  // Top failures
  const topFailures = Object.entries(failureMap)
    .map(([test, data]) => ({ test, type: data.type, failures: data.count }))
    .sort((a, b) => b.failures - a.failures)
    .slice(0, 5);

  return {
    stats,
    passRateData,
    executionByEnv,
    testDistribution,
    recentRuns,
    topFailures,
  };
}

function filterReportsByTimeRange(reports: SanityReport[], timeRange: string): SanityReport[] {
  const now = new Date().getTime()
  let cutoffMs: number

  switch (timeRange) {
    case "24h":
      cutoffMs = 24 * 60 * 60 * 1000 // 24 hours
      break
    case "7d":
      cutoffMs = 7 * 24 * 60 * 60 * 1000 // 7 days
      break
    case "30d":
      cutoffMs = 30 * 24 * 60 * 60 * 1000 // 30 days
      break
    case "90d":
      cutoffMs = 90 * 24 * 60 * 60 * 1000 // 90 days
      break
    default:
      cutoffMs = 7 * 24 * 60 * 60 * 1000 // default 7 days
  }

  return reports.filter(report => {
    const reportTime = new Date(report.createdAt).getTime()
    return now - reportTime <= cutoffMs
  })
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    stats: { totalRuns: 0, passRate: 0, testsExecuted: 0, environments: 0 },
    passRateData: [],
    executionByEnv: [],
    testDistribution: [],
    recentRuns: [],
    topFailures: [],
  });

  useEffect(() => {
    const raw = localStorage.getItem("sanityReports");
    const allReports: SanityReport[] = raw ? JSON.parse(raw) : [];
    const filteredReports = filterReportsByTimeRange(allReports, timeRange);
    setAnalytics(calculateAnalytics(filteredReports));
  }, [timeRange]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Results & Analytics</h1>
          <p className="text-muted-foreground">
            Track test performance and identify issues
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Test Runs
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.stats.totalRuns}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sanity test runs executed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pass Rate
            </CardTitle>
            <CheckCircle2 className={`h-4 w-4 ${analytics.stats.passRate >= 80 ? "text-green-500" : "text-red-500"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.stats.passRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall pass rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Environments
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.stats.environments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique environments tested
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tests Executed
            </CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.stats.testsExecuted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Individual test cases run
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pass/Fail Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.passRateData.length === 0 ? (
              <p className="text-muted-foreground text-sm h-64 flex items-center justify-center">No test data available yet</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.passRateData}>
                    <XAxis
                      dataKey="date"
                      stroke="var(--color-muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--color-muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="passed"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ fill: "#22c55e", strokeWidth: 0 }}
                      name="Passed"
                    />
                    <Line
                      type="monotone"
                      dataKey="failed"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: "#ef4444", strokeWidth: 0 }}
                      name="Failed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tests by Environment</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.executionByEnv.length === 0 ? (
              <p className="text-muted-foreground text-sm h-64 flex items-center justify-center">No test data available yet</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.executionByEnv} layout="vertical">
                    <XAxis
                      type="number"
                      stroke="var(--color-muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      dataKey="env"
                      type="category"
                      stroke="var(--color-muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => [`${value}`, "Test Runs"]}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--color-primary)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribution + Top Failures */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Test Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.testDistribution.length === 0 ? (
              <p className="text-muted-foreground text-sm h-48 flex items-center justify-center">No test data available yet</p>
            ) : (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.testDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {analytics.testDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-center gap-6">
                  {analytics.testDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Failing Tests</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topFailures.length === 0 ? (
              <p className="text-muted-foreground text-sm">No failed tests recorded</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Failures</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topFailures.map((failure, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{failure.test}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{failure.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2 text-destructive">
                          <XCircle className="h-4 w-4" />
                          {failure.failures}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Test Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Test Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentRuns.length === 0 ? (
            <p className="text-muted-foreground text-sm">No test runs recorded. Go to Test Runner to execute tests.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.recentRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-mono text-sm">{run.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{run.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{run.environment}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          run.status === "passed"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-red-500/10 text-red-600 border-red-500/20"
                        }
                      >
                        {run.status === "passed" ? (
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                        ) : (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-green-600">{run.tests.passed} passed</span>
                        {run.tests.failed > 0 && (
                          <span className="text-red-600">{run.tests.failed} failed</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {run.timestamp}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
