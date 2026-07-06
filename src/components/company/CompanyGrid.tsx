import type { Company } from "../../types";
import CompanyCard from "./CompanyCard";

export default function CompanyGrid({
  companies,
  onOpen,
}: {
  companies: Company[];
  onOpen: (id: string) => void;
}) {
  if (companies.length === 0) {
    return <p className="py-12 text-center text-gray-400">No companies match these filters.</p>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {companies.map((c) => (
          <CompanyCard key={c.id} company={c} onOpen={() => onOpen(c.id)} />
        ))}
      </div>
    </div>
  );
}
