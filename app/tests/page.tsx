"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Copy,
  FolderOpen,
  FileCode,
  Filter,
} from "lucide-react";

interface TestCase {
  id: string;
  name: string;
  description: string;
  suite: string;
  priority: "high" | "medium" | "low";
  status: "active" | "draft" | "deprecated";
  lastRun: string | null;
  lastResult: "passed" | "failed" | null;
  createdAt: string;
}

const mockTestCases: TestCase[] = [
  {
    id: "TC-001",
    name: "User login with valid credentials",
    description: "Verify that users can log in with valid email and password",
    suite: "Authentication",
    priority: "high",
    status: "active",
    lastRun: "2 hours ago",
    lastResult: "passed",
    createdAt: "2024-01-10",
  },
  {
    id: "TC-002",
    name: "User login with invalid password",
    description: "Verify error message when password is incorrect",
    suite: "Authentication",
    priority: "high",
    status: "active",
    lastRun: "2 hours ago",
    lastResult: "passed",
    createdAt: "2024-01-10",
  },
  {
    id: "TC-003",
    name: "Password reset email delivery",
    description: "Verify password reset email is sent successfully",
    suite: "Authentication",
    priority: "medium",
    status: "active",
    lastRun: "1 day ago",
    lastResult: "failed",
    createdAt: "2024-01-11",
  },
  {
    id: "TC-004",
    name: "Add item to shopping cart",
    description: "Verify items can be added to cart from product page",
    suite: "E-commerce",
    priority: "high",
    status: "active",
    lastRun: "3 hours ago",
    lastResult: "passed",
    createdAt: "2024-01-12",
  },
  {
    id: "TC-005",
    name: "Checkout process completion",
    description: "Verify complete checkout flow with payment",
    suite: "E-commerce",
    priority: "high",
    status: "draft",
    lastRun: null,
    lastResult: null,
    createdAt: "2024-01-15",
  },
  {
    id: "TC-006",
    name: "API response time under load",
    description: "Verify API responds within 200ms under 1000 concurrent users",
    suite: "Performance",
    priority: "medium",
    status: "active",
    lastRun: "5 hours ago",
    lastResult: "passed",
    createdAt: "2024-01-08",
  },
  {
    id: "TC-007",
    name: "Database backup integrity",
    description: "Verify database backups can be restored successfully",
    suite: "Infrastructure",
    priority: "low",
    status: "deprecated",
    lastRun: "1 week ago",
    lastResult: "passed",
    createdAt: "2024-01-05",
  },
];

const suites = ["All Suites", "Authentication", "E-commerce", "Performance", "Infrastructure"];

export default function TestCasesPage() {
  const searchParams = useSearchParams();
  const [testCases, setTestCases] = useState<TestCase[]>(mockTestCases);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSuite, setSelectedSuite] = useState("All Suites");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    name: "",
    description: "",
    suite: "",
    priority: "medium" as const,
  });

  const filteredTestCases = testCases.filter((tc) => {
    const matchesSearch =
      tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSuite = selectedSuite === "All Suites" || tc.suite === selectedSuite;
    return matchesSearch && matchesSuite;
  });

  const handleCreateTest = () => {
    const newTestCase: TestCase = {
      id: `TC-${String(testCases.length + 1).padStart(3, "0")}`,
      name: newTest.name,
      description: newTest.description,
      suite: newTest.suite,
      priority: newTest.priority,
      status: "draft",
      lastRun: null,
      lastResult: null,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setTestCases([...testCases, newTestCase]);
    setNewTest({ name: "", description: "", suite: "", priority: "medium" });
    setIsDialogOpen(false);
  };

  const handleDeleteTest = (id: string) => {
    setTestCases(testCases.filter((tc) => tc.id !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "low":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "draft":
        return "bg-primary/10 text-primary border-primary/20";
      case "deprecated":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getResultColor = (result: string | null) => {
    switch (result) {
      case "passed":
        return "text-success";
      case "failed":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const stats = {
    total: testCases.length,
    active: testCases.filter((tc) => tc.status === "active").length,
    passed: testCases.filter((tc) => tc.lastResult === "passed").length,
    failed: testCases.filter((tc) => tc.lastResult === "failed").length,
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      <DashboardLayout title="Test Cases" description="Create, organize, and manage your test cases">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Test Case Management</h1>
              <p className="text-muted-foreground">
                Create, organize, and manage your test cases
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Test Case
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Test Case</DialogTitle>
                  <DialogDescription>
                    Add a new test case to your test suite
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Test Name</Label>
                    <Input
                      id="name"
                      value={newTest.name}
                      onChange={(e) =>
                        setNewTest({ ...newTest, name: e.target.value })
                      }
                      placeholder="e.g., User login with valid credentials"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTest.description}
                      onChange={(e) =>
                        setNewTest({ ...newTest, description: e.target.value })
                      }
                      placeholder="Describe what this test case validates..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="suite">Test Suite</Label>
                      <Select
                        value={newTest.suite}
                        onValueChange={(value) =>
                          setNewTest({ ...newTest, suite: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select suite" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Authentication">Authentication</SelectItem>
                          <SelectItem value="E-commerce">E-commerce</SelectItem>
                          <SelectItem value="Performance">Performance</SelectItem>
                          <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={newTest.priority}
                        onValueChange={(value: "high" | "medium" | "low") =>
                          setNewTest({ ...newTest, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTest} disabled={!newTest.name || !newTest.suite}>
                    Create Test Case
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Tests
                </CardTitle>
                <FileCode className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Tests
                </CardTitle>
                <Play className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Passed
                </CardTitle>
                <div className="h-2 w-2 rounded-full bg-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{stats.passed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Failed
                </CardTitle>
                <div className="h-2 w-2 rounded-full bg-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Test Cases</CardTitle>
                <div className="flex gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search tests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedSuite} onValueChange={setSelectedSuite}>
                    <SelectTrigger className="w-40">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {suites.map((suite) => (
                        <SelectItem key={suite} value={suite}>
                          {suite}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Suite</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTestCases.map((tc) => (
                    <TableRow key={tc.id}>
                      <TableCell className="font-mono text-sm">{tc.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tc.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {tc.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <FolderOpen className="h-3 w-3" />
                          {tc.suite}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPriorityColor(tc.priority)}>
                          {tc.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(tc.status)}>
                          {tc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {tc.lastRun || "Never"}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getResultColor(tc.lastResult)}`}>
                          {tc.lastResult ? tc.lastResult.charAt(0).toUpperCase() + tc.lastResult.slice(1) : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Play className="mr-2 h-4 w-4" />
                              Run Test
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteTest(tc.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredTestCases.length === 0 && (
                <div className="py-12 text-center">
                  <FileCode className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No test cases found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </Suspense>
  );
}

function LoadingFallback() {
  return null;
}

