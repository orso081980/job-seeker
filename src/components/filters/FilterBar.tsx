import type { Filters } from "../../hooks/useCompanyFilters";
import SearchInput from "./SearchInput";
import FilterSelects from "./FilterSelects";
import ViewToggle from "./ViewToggle";
import Button from "../ui/Button";

export default function FilterBar({
  filters,
  onChange,
  countries,
  industries,
  view,
  onViewChange,
  onAdd,
  resultCount,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  countries: string[];
  industries: string[];
  view: "grid" | "kanban";
  onViewChange: (v: "grid" | "kanban") => void;
  onAdd: () => void;
  resultCount: number;
}) {
  return (
    <div className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-ink-950/80">
      <div className="mx-auto max-w-7xl space-y-3 px-6 py-3">
        <SearchInput value={filters.search} onChange={(search) => onChange({ ...filters, search })} />

        <FilterSelects
          filters={filters}
          onChange={onChange}
          countries={countries}
          industries={industries}
          resultCount={resultCount}
        />

        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={onViewChange} />
          <Button className="ml-auto" onClick={onAdd}>
            + Add company
          </Button>
        </div>
      </div>
    </div>
  );
}
