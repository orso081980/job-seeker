import { STATUSES } from "../../types";
import { DEFAULT_FILTERS, isDefaultFilters } from "../../hooks/useCompanyFilters";
import type { Filters } from "../../hooks/useCompanyFilters";
import { countryFlag } from "../../utils/countryFlag";
import Select from "../ui/Select";
import Checkbox from "../ui/Checkbox";
import Button from "../ui/Button";

const selectCls = "w-32 shrink-0 truncate";

export default function FilterSelects({
  filters,
  onChange,
  countries,
  industries,
  resultCount,
  showStatus = true,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  countries: string[];
  industries: string[];
  resultCount: number;
  showStatus?: boolean;
}) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      <Select value={filters.country} onChange={(e) => set("country", e.target.value)} className={selectCls}>
        <option value="all">Country</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {countryFlag(c)} {c}
          </option>
        ))}
      </Select>

      <Select
        value={filters.industry}
        onChange={(e) => set("industry", e.target.value)}
        className={selectCls}
      >
        <option value="all">Industry</option>
        {industries.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </Select>

      {showStatus && (
        <Select
          value={filters.status}
          onChange={(e) => set("status", e.target.value as Filters["status"])}
          className={selectCls}
        >
          <option value="all">Status</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      )}

      <Select
        value={filters.sort}
        onChange={(e) => set("sort", e.target.value as Filters["sort"])}
        className={`${selectCls} w-40`}
      >
        <option value="updated">Sort: recently updated</option>
        <option value="uploaded">Sort: uploaded</option>
        <option value="name">Sort: name</option>
        <option value="rating">Sort: rating</option>
      </Select>

      <Checkbox
        className="shrink-0 text-sm text-gray-600 dark:text-gray-300"
        checked={filters.jobOnly}
        onChange={(e) => set("jobOnly", e.target.checked)}
        label="Job posting only"
      />

      {!isDefaultFilters(filters) && (
        <Button variant="ghost" size="sm" className="shrink-0" onClick={() => onChange(DEFAULT_FILTERS)}>
          Clear filters
        </Button>
      )}

      <span className="shrink-0 text-xs text-gray-400">{resultCount} companies</span>
    </div>
  );
}
