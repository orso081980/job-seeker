import type { Company } from "../../types";
import Label from "../ui/Label";
import Input from "../ui/Input";
import FormField from "../ui/FormField";

export default function SourceFieldset({
  form,
  editable,
  onChange,
}: {
  form: Pick<Company, "address" | "mapsUrl" | "searchQuery">;
  editable: boolean;
  onChange: <K extends keyof Company>(key: K, value: Company[K]) => void;
}) {
  return (
    <fieldset className="space-y-2 rounded-md border border-gray-200 p-3 dark:border-white/10">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Source
      </legend>
      <FormField
        label="Address"
        editable={editable}
        value={form.address}
        onChange={(v) => onChange("address", v)}
      />
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Found via search"
          editable={editable}
          value={form.searchQuery}
          onChange={(v) => onChange("searchQuery", v)}
        />
        <div>
          <Label>Google Maps</Label>
          {editable ? (
            <Input value={form.mapsUrl} onChange={(e) => onChange("mapsUrl", e.target.value)} />
          ) : form.mapsUrl ? (
            <a
              href={form.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 block text-sm text-brand-600 hover:underline dark:text-brand-300"
            >
              View on Maps ↗
            </a>
          ) : (
            <p className="mt-1.5 text-sm text-gray-400">—</p>
          )}
        </div>
      </div>
    </fieldset>
  );
}
