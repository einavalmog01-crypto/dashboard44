"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RecentTest {
  id: string;
  name: string;
  status: "passed" | "failed";
  environment: string;
  time: string;
  type: string;
}

export function RecentTests() {
  const [recentTests, setRecentTests] = useState<RecentTest[]>([]);
  const [loading, setLoading] = useState(true);

  const formatTimeAgo = (dateString: string): string => {
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
  };

  useEffect(() => {
    // Load recent tests from sanityReports (same source the Test Runner saves to)
    try {
      const raw = localStorage.getItem("sanityReports");
      if (raw) {
        const reports: {
          id: string;
          type: string;
          environment: string;
          createdAt: string;
          tests: { name: string; status: "PASS" | "FAILED"; error: string }[];
        }[] = JSON.parse(raw);

        // Flatten reports into individual test entries
        const allTests: RecentTest[] = [];
        for (const report of reports) {
          for (const test of report.tests) {
            allTests.push({
              id: `${report.id}-${test.name}`,
              name: test.name,
              status: test.status === "PASS" ? "passed" : "failed",
              environment: report.environment,
              time: report.createdAt,
              type: report.type,
            });
          }
        }

        // Sort by time descending and format
        const sorted = allTests
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 10)
          .map((t) => ({ ...t, time: formatTimeAgo(t.time) }));

        setRecentTests(sorted);
      }
    } catch (err) {
      console.error("Error loading recent tests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Recent Tests</CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading recent tests...</p>
        ) : recentTests.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No tests have been run yet. Go to Test Runner to execute tests.
          </p>
        ) : (
          <div className="space-y-4">
            {recentTests.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      test.status === "passed" && "bg-green-500",
                      test.status === "failed" && "bg-red-500"
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{test.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {test.environment} - {test.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{test.type}</span>
                  <Badge
                    variant={test.status === "passed" ? "default" : "destructive"}
                    className={cn(
                      "capitalize",
                      test.status === "passed" &&
                        "bg-green-500/20 text-green-600 hover:bg-green-500/30"
                    )}
                  >
                    {test.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
