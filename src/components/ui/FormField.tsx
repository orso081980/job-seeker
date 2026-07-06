import Label from "./Label";
import Input from "./Input";
import Textarea from "./Textarea";

export default function FormField({
  label,
  editable,
  value,
  onChange,
  as = "input",
  rows,
  mono = false,
  placeholder,
  autoFocus,
}: {
  label: string;
  editable: boolean;
  value: string;
  onChange?: (value: string) => void;
  as?: "input" | "textarea";
  rows?: number;
  mono?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {editable ? (
        as === "textarea" ? (
          <Textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            rows={rows}
            mono={mono}
            placeholder={placeholder}
            autoFocus={autoFocus}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            mono={mono}
            placeholder={placeholder}
            autoFocus={autoFocus}
          />
        )
      ) : (
        <p
          className={`text-sm text-gray-700 dark:text-gray-200 ${
            mono ? "whitespace-pre-line font-mono" : ""
          }`}
        >
          {value || "—"}
        </p>
      )}
    </div>
  );
}
