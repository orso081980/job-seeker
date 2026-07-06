import { useState } from "react";
import type { Company, Status } from "../../types";
import { STATUSES } from "../../types";
import CompanyCard from "./CompanyCard";

export default function KanbanBoard({
  companies,
  onOpen,
  onStatusChange,
}: {
  companies: Company[];
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: Status) => void;
}) {
  const [dragOverStatus, setDragOverStatus] = useState<Status | null>(null);

  return (
    <div className="mx-auto flex max-w-7xl gap-4 overflow-x-auto px-6 py-6">
      {STATUSES.map((col) => {
        const items = companies.filter((c) => c.status === col.value);
        return (
          <div
            key={col.value}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(col.value);
            }}
            onDragLeave={() => setDragOverStatus(null)}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/company-id");
              if (id) onStatusChange(id, col.value);
              setDragOverStatus(null);
            }}
            className={`flex w-72 shrink-0 flex-col rounded-2xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5 ${
              dragOverStatus === col.value ? "ring-2 ring-brand-400" : ""
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-white/10">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {col.label}
              </span>
              <span className="text-xs text-gray-400">{items.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-3">
              {items.map((c) => (
                <CompanyCard
                  key={c.id}
                  company={c}
                  onOpen={() => onOpen(c.id)}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/company-id", c.id)}
                />
              ))}
              {items.length === 0 && (
                <p className="py-6 text-center text-xs text-gray-400">Drop here</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
