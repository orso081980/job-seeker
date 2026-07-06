import { useMemo, useState } from "react";
import type { Company, Status } from "../types";

export interface Filters {
  search: string;
  country: string;
  industry: string;
  status: Status | "all";
  jobOnly: boolean;
  sort: "updated" | "uploaded" | "name" | "rating";
}

export const DEFAULT_FILTERS: Filters = {
  search: "",
  country: "all",
  industry: "all",
  status: "all",
  jobOnly: false,
  sort: "updated",
};

export function isDefaultFilters(filters: Filters): boolean {
  return Object.entries(DEFAULT_FILTERS).every(
    ([key, value]) => filters[key as keyof Filters] === value
  );
}

export function useCompanyFilters(companies: Company[]) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const countries = useMemo(
    () => Array.from(new Set(companies.map((c) => c.country))).sort(),
    [companies]
  );
  const industries = useMemo(
    () => Array.from(new Set(companies.map((c) => c.industry))).sort(),
    [companies]
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    let list = companies.filter((c) => {
      if (filters.country !== "all" && c.country !== filters.country) return false;
      if (filters.industry !== "all" && c.industry !== filters.industry) return false;
      if (filters.status !== "all" && c.status !== filters.status) return false;
      if (filters.jobOnly && !c.hasJobPosting) return false;
      if (
        q &&
        !`${c.company} ${c.industry} ${c.description}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (filters.sort === "rating") return b.rating - a.rating;
      if (filters.sort === "name") return a.company.localeCompare(b.company);
      if (filters.sort === "uploaded") return b.createdAt.localeCompare(a.createdAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return list;
  }, [companies, filters]);

  return { filters, setFilters, countries, industries, filtered };
}
