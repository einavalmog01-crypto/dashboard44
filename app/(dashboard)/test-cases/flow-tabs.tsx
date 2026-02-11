"use client";
import { useState } from "react";
const tabs = ["Main Flow", "Negative Scenarios", "Edge Cases"];
export default function FlowTabs({ flows }: { flows: string[] }) {
  const [active, setActive] = useState(tabs[0]);
return (
    <div>
      <div className="flex gap-4 border-b mb-4">
        {tabs.map(tab =>
          flows.includes(tab) ? (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`pb-2 ${
                active === tab ? "border-b-2 font-bold" : ""
              }`}
            >
              {tab}
            </button>
          ) : null
        )}
      </div>
<div>
        <p>{active} content goes here</p>
      </div>
    </div>
  );
}