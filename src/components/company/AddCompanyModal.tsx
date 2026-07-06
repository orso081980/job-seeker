import { useState } from "react";
import type { NewCompanyInput } from "../../types";
import Modal from "../ui/Modal";
import FormField from "../ui/FormField";
import Button from "../ui/Button";

export default function AddCompanyModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: NewCompanyInput) => Promise<void>;
}) {
  const [form, setForm] = useState<NewCompanyInput>({
    company: "",
    website: "",
    city: "",
    country: "",
    industry: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field = <K extends keyof NewCompanyInput>(key: K, value: NewCompanyInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!form.company.trim() || !form.website.trim()) {
      setError("Company and website are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(form);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add company.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal className="max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-gray-100">
          Add a prospect
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close ✕
        </Button>
      </div>

      <div className="space-y-3">
        <FormField
          label="Company *"
          editable
          value={form.company}
          onChange={(v) => field("company", v)}
          autoFocus
        />
        <FormField
          label="Website *"
          editable
          value={form.website}
          onChange={(v) => field("website", v)}
          placeholder="https://…"
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="City" editable value={form.city} onChange={(v) => field("city", v)} />
          <FormField label="Country" editable value={form.country} onChange={(v) => field("country", v)} />
        </div>
        <FormField label="Industry" editable value={form.industry} onChange={(v) => field("industry", v)} />
        <FormField
          label="Description"
          editable
          as="textarea"
          rows={2}
          value={form.description}
          onChange={(v) => field("description", v)}
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex justify-end">
        <Button onClick={submit} disabled={submitting}>
          {submitting ? "Adding…" : "Add company"}
        </Button>
      </div>
    </Modal>
  );
}
