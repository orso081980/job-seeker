import { useEffect, useState } from "react";
import type { Company, NewCompanyInput } from "../types";
import { api } from "../api/client";

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reload();
  }, []);

  function reload() {
    return api
      .list()
      .then(setCompanies)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  const create = async (input: NewCompanyInput) => {
    const created = await api.create(input);
    setCompanies((cs) => [...cs, created]);
  };

  const update = async (id: string, patch: Partial<Company>) => {
    const updated = await api.update(id, patch);
    setCompanies((cs) => cs.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const remove = async (id: string) => {
    await api.remove(id);
    setCompanies((cs) => cs.filter((c) => c.id !== id));
  };

  const addLocal = (company: Company) => {
    setCompanies((cs) => [...cs, company]);
  };

  const replaceLocal = (company: Company) => {
    setCompanies((cs) => cs.map((c) => (c.id === company.id ? company : c)));
  };

  return { companies, loading, error, create, update, remove, addLocal, replaceLocal, reload };
}
