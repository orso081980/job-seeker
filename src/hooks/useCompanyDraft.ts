import { useEffect, useState } from "react";
import type { Company } from "../types";

export function useCompanyDraft(
  company: Company,
  onSave: (id: string, patch: Partial<Company>) => Promise<unknown>,
  onClose: () => void
) {
  const [form, setForm] = useState(company);
  const [saveState, setSaveState] = useState<"idle" | "saving">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setForm(company);
    setSaveState("idle");
    setSaveError(null);
  }, [company]);

  const set = <K extends keyof Company>(key: K, value: Company[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const saveAndClose = async () => {
    setSaveState("saving");
    setSaveError(null);
    try {
      await onSave(company.id, form);
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save.");
      setSaveState("idle");
    }
  };

  return { form, set, saveState, saveError, saveAndClose };
}
