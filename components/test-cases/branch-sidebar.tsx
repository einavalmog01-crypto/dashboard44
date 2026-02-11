"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Branch } from "@/app/(dashboard)/test-cases/page";
export default function BranchSidebar({
  branches,
}: {
  branches: Branch[];
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
const filteredBranches = useMemo(() => {
    return [...branches]
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter((b) =>
        b.name.toLowerCase().includes(query.toLowerCase())
      );
  }, [branches, query]);
return (
    <aside className="w-64 border-r bg-muted/40 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Branches</h2>
        <Button size="icon" variant="ghost">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
<Input
        placeholder="Search branches…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
<nav className="space-y-1">
        {filteredBranches.map((branch) => {
          const href = `/test-cases/${branch.slug}`;
          const active = pathname === href;
return (
            <Link
              key={branch.id}
              href={href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm transition",
                active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              {branch.name}
            </Link>
          );
        })}
{filteredBranches.length === 0 && (
          <p className="text-xs text-muted-foreground px-2">
            No branches found
          </p>
        )}
      </nav>
    </aside>
  );
}
