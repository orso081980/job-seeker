import type { Company, Status } from "../../types";
import { STATUSES } from "../../types";
import { countryFlag } from "../../utils/countryFlag";
import { useCompanyDraft } from "../../hooks/useCompanyDraft";
import Drawer from "../ui/Drawer";
import Label from "../ui/Label";
import FormField from "../ui/FormField";
import Select from "../ui/Select";
import Checkbox from "../ui/Checkbox";
import Input from "../ui/Input";
import StarRating from "../ui/StarRating";
import StatusBadge from "./StatusBadge";
import DrawerHeader from "./DrawerHeader";
import SourceFieldset from "./SourceFieldset";
import ContactFieldset from "./ContactFieldset";
import TechStackField from "./TechStackField";
import DrawerActions from "./DrawerActions";

export default function CompanyDrawer({
  company,
  authed,
  onClose,
  onUpdate,
  onDelete,
}: {
  company: Company;
  authed: boolean;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Company>) => Promise<unknown>;
  onDelete: (id: string) => void;
}) {
  const { form, set, saveState, saveError, saveAndClose } = useCompanyDraft(company, onUpdate, onClose);

  return (
    <Drawer onClose={onClose} onBackdropClick={authed ? undefined : onClose}>
      <DrawerHeader
        website={company.website}
        companyName={company.company}
        status={form.status}
        authed={authed}
        saving={saveState === "saving"}
      />

      <div className="flex-1 space-y-5 p-5">
        <div>
          {authed ? (
            <Input
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              className="!border-none !bg-transparent !p-0 text-xl font-semibold text-gray-900 focus:outline-none dark:text-gray-100"
            />
          ) : (
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{form.company}</p>
          )}
          {authed ? (
            <div className="flex items-center gap-2">
              <Input
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                className="!border-none !bg-transparent !p-0 text-sm text-brand-600 focus:outline-none dark:text-brand-300"
                placeholder="https://example.com"
              />
              {form.website && (
                <a
                  href={form.website}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-xs text-gray-400 hover:underline dark:text-gray-500"
                >
                  Open ↗
                </a>
              )}
            </div>
          ) : (
            <a
              href={form.website}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-brand-600 hover:underline dark:text-brand-300"
            >
              {form.website} ↗
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="City" editable={authed} value={form.city} onChange={(v) => set("city", v)} />
          <div>
            <Label>Country</Label>
            <div className="flex items-center gap-1.5">
              <span aria-hidden="true">{countryFlag(form.country)}</span>
              {authed ? (
                <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-200">{form.country || "—"}</p>
              )}
            </div>
          </div>
        </div>

        <FormField
          label="Industry"
          editable={authed}
          value={form.industry}
          onChange={(v) => set("industry", v)}
        />

        <FormField
          label="Website languages"
          editable={authed}
          value={form.languages}
          onChange={(v) => set("languages", v)}
          placeholder="e.g. English, French, Dutch"
        />

        <FormField
          label="Description"
          editable={authed}
          as="textarea"
          rows={2}
          value={form.description}
          onChange={(v) => set("description", v)}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Status</Label>
            {authed ? (
              <Select value={form.status} onChange={(e) => set("status", e.target.value as Status)}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            ) : (
              <div className="pt-1.5">
                <StatusBadge status={form.status} />
              </div>
            )}
          </div>
          <div>
            <Label>Priority</Label>
            <div className="pt-1.5">
              <StarRating value={form.rating} onChange={authed ? (rating) => set("rating", rating) : undefined} />
            </div>
          </div>
        </div>

        <div className="rounded-md border border-gray-200 p-3 dark:border-white/10">
          <Checkbox
            className="text-sm font-medium text-gray-700 dark:text-gray-200"
            checked={form.hasJobPosting}
            disabled={!authed}
            onChange={(e) => set("hasJobPosting", e.target.checked)}
            label="Has an open job posting"
          />
          {form.hasJobPosting &&
            (authed ? (
              <Input
                className="mt-2"
                value={form.jobUrl}
                onChange={(e) => set("jobUrl", e.target.value)}
                placeholder="Direct link to the job posting"
              />
            ) : (
              form.jobUrl && (
                <a
                  href={form.jobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs text-brand-600 hover:underline dark:text-brand-300"
                >
                  View job posting ↗
                </a>
              )
            ))}
        </div>

        <SourceFieldset form={form} editable={authed} onChange={set} />

        <ContactFieldset form={form} editable={authed} onChange={set} />

        <TechStackField
          website={form.website}
          value={form.techStackNotes}
          editable={authed}
          onChange={(v) => set("techStackNotes", v)}
        />

        <div>
          <FormField
            label="Project URL (Vercel / Cloudflare / AWS)"
            editable={authed}
            value={form.projectUrl}
            onChange={(v) => set("projectUrl", v)}
            placeholder="https://your-redesign.vercel.app"
          />
          {form.projectUrl && (
            <a
              href={form.projectUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs text-brand-600 hover:underline dark:text-brand-300"
            >
              View live demo ↗
            </a>
          )}
        </div>

        <div>
          <FormField
            label="GitHub repo"
            editable={authed}
            value={form.githubUrl}
            onChange={(v) => set("githubUrl", v)}
            placeholder="https://github.com/you/project"
          />
          {form.githubUrl && (
            <a
              href={form.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs text-brand-600 hover:underline dark:text-brand-300"
            >
              View on GitHub ↗
            </a>
          )}
        </div>

        <FormField
          label="Redesign ideas / potential improvements"
          editable={authed}
          as="textarea"
          rows={4}
          value={form.notes}
          onChange={(v) => set("notes", v)}
          placeholder="Outdated design, no mobile nav, missing CTA above the fold…"
        />

        {authed && (
          <DrawerActions
            companyName={company.company}
            saving={saveState === "saving"}
            saveError={saveError}
            onDelete={() => onDelete(company.id)}
            onSaveAndClose={saveAndClose}
          />
        )}
      </div>
    </Drawer>
  );
}
