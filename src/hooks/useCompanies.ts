import { useEffect, useState } from "react";
import type { Company, NewCompanyInput } from "../types";
import { api } from "../api/client";

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ids currently being written to the server (drives the "syncing" spinner
  // on a company card while a drag-and-drop status change is in flight).
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  // Id of the company whose update most recently landed, so its card can
  // flash a brief success cue. Cleared automatically after the animation.
  const [flashId, setFlashId] = useState<string | null>(null);
  // Most recent failed update, so the UI can tell the user their change
  // didn't stick (and that we already reverted it) instead of staying silent.
  const [updateError, setUpdateError] = useState<{ id: string; company: string; message: string } | null>(
    null
  );

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
    let previous: Company | undefined;
    setCompanies((cs) =>
      cs.map((c) => {
        if (c.id !== id) return c;
        previous = c;
        return { ...c, ...patch };
      })
    );
    setSavingIds((ids) => new Set(ids).add(id));

    try {
      const updated = await api.update(id, patch);
      setCompanies((cs) => cs.map((c) => (c.id === id ? updated : c)));
      setFlashId(id);
      setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 900);
      return updated;
    } catch (e) {
      // Roll back the optimistic change so the UI matches what the server
      // actually has, and surface why the card snapped back.
      if (previous) {
        const reverted = previous;
        setCompanies((cs) => cs.map((c) => (c.id === id ? reverted : c)));
      }
      setUpdateError({
        id,
        company: previous?.company ?? "Company",
        message: e instanceof Error ? e.message : "Update failed",
      });
      throw e;
    } finally {
      setSavingIds((ids) => {
        const next = new Set(ids);
        next.delete(id);
        return next;
      });
    }
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

  return {
    companies,
    loading,
    error,
    create,
    update,
    remove,
    addLocal,
    replaceLocal,
    reload,
    savingIds,
    flashId,
    updateError,
    clearUpdateError: () => setUpdateError(null),
  };
}
