import { useState, type FormEvent } from "react";
import type { SourceSearchParams } from "../../types";
import Label from "../ui/Label";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function SourceSearchForm({
  onSearch,
  searching,
}: {
  onSearch: (params: SourceSearchParams) => void;
  searching: boolean;
}) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch({ query: query.trim(), city: city.trim(), country: country.trim() });
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div className="w-56">
        <Label>Keyword / category</Label>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. marketing agency"
          autoFocus
        />
      </div>
      <div className="w-40">
        <Label>City</Label>
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Brussels" />
      </div>
      <div className="w-40">
        <Label>Country</Label>
        <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Belgium" />
      </div>
      <Button type="submit" disabled={searching || !query.trim()}>
        {searching ? "Searching…" : "Search Google Maps"}
      </Button>
    </form>
  );
}
