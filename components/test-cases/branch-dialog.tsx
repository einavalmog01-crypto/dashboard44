"use client";

import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Branch } from "@/app/(dashboard)/test-cases/page";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function BranchDialog({
  open,
  onOpenChange,
  branch,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: Branch | null;
  onSave: (branch: Branch) => void;
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(branch?.name ?? "");
  }, [branch]);

  function handleSave() {
    const slug = slugify(name);
    onSave({
      id: branch?.id ?? nanoid(),
      name,
      slug,
      createdAt: branch?.createdAt ?? Date.now(),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {branch ? "Edit Branch" : "Add Branch"}
          </DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Branch name (e.g. Wave 12)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <DialogFooter>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
