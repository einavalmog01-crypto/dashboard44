"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { nanoid } from "nanoid";

// Branch type
export type Branch = {
  id: string;
  name: string;
  slug: string;
  createdAt: number;
};

// Context value type
type BranchContextValue = {
  branches: Branch[];
  addBranch: (branch: Omit<Branch, "id" | "createdAt">) => void;
  editBranch: (branch: Branch) => void;
  deleteBranch: (id: string) => void;
};

// Create context
const BranchContext = createContext<BranchContextValue | undefined>(undefined);

// Hook to use context
export function useBranchContext() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranchContext must be used within BranchProvider");
  return ctx;
}

// Provider component
export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([
    { id: nanoid(), name: "Wave 11", slug: "wave-11", createdAt: Date.now() - 1000 },
    { id: nanoid(), name: "Wave 10.2", slug: "wave-10-2", createdAt: Date.now() - 2000 },
  ]);

  // Add a branch
  function addBranch(branch: Omit<Branch, "id" | "createdAt">) {
    const newBranch: Branch = {
      ...branch,
      id: nanoid(),
      createdAt: Date.now(),
    };
    setBranches((prev) => [newBranch, ...prev]); // newest first
  }

  // Edit a branch
  function editBranch(branch: Branch) {
    setBranches((prev) =>
      prev.map((b) => (b.id === branch.id ? branch : b))
    );
  }

  // Delete a branch
  function deleteBranch(id: string) {
    setBranches((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <BranchContext.Provider
      value={{ branches, addBranch, editBranch, deleteBranch }}
    >
      {children}
    </BranchContext.Provider>
  );
}
