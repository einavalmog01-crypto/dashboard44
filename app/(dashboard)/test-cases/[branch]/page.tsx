"use client"; // ✅ ensure this is at the top

import { useState } from "react"; // ✅ added this
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Your Branch type and initialBranches stay the same
export type Branch = {
  id: string;
  name: string;
  slug: string;
  createdAt: number;
};

const initialBranches: Branch[] = [
  { id: "1", name: "Wave 11", slug: "wave-11", createdAt: Date.now() - 1000 },
  { id: "2", name: "Wave 10.2", slug: "wave-10-2", createdAt: Date.now() - 2000 },
];

export default function TestCasesPage() {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);

  // NEW: state for inline new branch creation
  const [creatingNew, setCreatingNew] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");

  function upsertBranch(branch: Branch) {
    setBranches((prev) => {
      const exists = prev.find((b) => b.id === branch.id);
      if (exists) {
        return prev.map((b) => (b.id === branch.id ? branch : b));
      }
      return [...prev, branch];
    });
  }

  function deleteBranch(id: string) {
    setBranches((prev) => prev.filter((b) => b.id !== id));
  }

  const sortedBranches = [...branches].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  function handleAddBranch() {
    if (!newBranchName.trim()) return;
    const newBranch: Branch = {
      id: Date.now().toString(),
      name: newBranchName,
      slug: newBranchName.toLowerCase().replace(/\s+/g, "-"),
      createdAt: Date.now(),
    };
    upsertBranch(newBranch);
    setNewBranchName("");
    setCreatingNew(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Test Cases</h1>
        {/* Green Add Branch button removed */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedBranches.map((branch) => (
          <div
            key={branch.id}
            className="relative rounded-xl border p-6 shadow hover:shadow-lg transition"
          >
            <Link href={`/test-cases/${branch.slug}`}>
              <h2 className="text-xl font-bold">📦 {branch.name}</h2>
              <p className="text-sm text-muted-foreground">
                Click to view epics & test cases
              </p>
            </Link>

            <div className="absolute right-4 top-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingBranch(branch);
                      setCreatingNew(false); // prevent conflict
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeletingBranch(branch)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {/* NEW branch input inline */}
        {creatingNew && (
          <div className="relative rounded-xl border p-6 shadow transition flex flex-col gap-2">
            <input
              className="border rounded px-2 py-1 text-sm"
              placeholder="New branch name"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddBranch()}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddBranch}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCreatingNew(false);
                  setNewBranchName("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
