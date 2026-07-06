import type { Company } from "../../types";
import FormField from "../ui/FormField";

export default function ContactFieldset({
  form,
  editable,
  onChange,
}: {
  form: Pick<Company, "contactName" | "contactEmail" | "contactPhone" | "contactLinkedIn">;
  editable: boolean;
  onChange: <K extends keyof Company>(key: K, value: Company[K]) => void;
}) {
  return (
    <fieldset className="space-y-2 rounded-md border border-gray-200 p-3 dark:border-white/10">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Contact
      </legend>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Name"
          editable={editable}
          value={form.contactName}
          onChange={(v) => onChange("contactName", v)}
        />
        <FormField
          label="Email"
          editable={editable}
          value={form.contactEmail}
          onChange={(v) => onChange("contactEmail", v)}
        />
        <FormField
          label="Phone"
          editable={editable}
          value={form.contactPhone}
          onChange={(v) => onChange("contactPhone", v)}
        />
        <FormField
          label="LinkedIn"
          editable={editable}
          value={form.contactLinkedIn}
          onChange={(v) => onChange("contactLinkedIn", v)}
        />
      </div>
    </fieldset>
  );
}
