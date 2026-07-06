import Input from "../ui/Input";

export default function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      type="text"
      placeholder="Search company, industry, description…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
