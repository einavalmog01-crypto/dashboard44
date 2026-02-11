"use client";

import { useState } from "react";

type TreeNode = {
  id: string;
  label: string;
  children?: TreeNode[];
};

export default function TreeView({ data }: { data: TreeNode[] }) {
  return (
    <ul className="space-y-2">
      {data.map((node) => (
        <TreeNodeItem key={node.id} node={node} />
      ))}
    </ul>
  );
}

function TreeNodeItem({ node }: { node: TreeNode }) {
  const [open, setOpen] = useState(true);

  return (
    <li>
      <div
        className="cursor-pointer font-medium"
        onClick={() => setOpen(!open)}
      >
        {node.children && (open ? "▼ " : "▶ ")}
        {node.label}
      </div>

      {open && node.children && (
        <ul className="ml-4 mt-2 space-y-1">
          {node.children.map((child) => (
            <li key={child.id} className="text-sm text-muted-foreground">
              {child.label}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
