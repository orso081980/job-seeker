import { builtWithUrl } from "../../api/client";
import { useStackDetection } from "../../hooks/useStackDetection";
import Label from "../ui/Label";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";

export default function TechStackField({
  website,
  value,
  editable,
  onChange,
}: {
  website: string;
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
}) {
  const { detecting, error, detect } = useStackDetection(onChange);

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>Tech stack notes</Label>
        {editable && (
          <div className="flex items-center gap-3">
            <Button
              variant="text"
              size="xs"
              onClick={() => detect(website, value)}
              disabled={detecting || !website}
            >
              {detecting ? "Detecting…" : "Auto-detect stack"}
            </Button>
            <a
              href={builtWithUrl(website)}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand-600 hover:underline dark:text-brand-300"
            >
              Look up on BuiltWith ↗
            </a>
          </div>
        )}
      </div>
      {editable ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          mono
          placeholder="e.g. WordPress, jQuery, no HTTPS mixed content, slow LCP…"
        />
      ) : (
        <p className="whitespace-pre-line font-mono text-sm text-gray-700 dark:text-gray-200">
          {value || "—"}
        </p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
