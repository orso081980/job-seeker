import { useState, type FormEvent } from "react";
import type { SourceResult, SourceSearchParams } from "../../types";
import Label from "../ui/Label";
import Input from "../ui/Input";
import Button from "../ui/Button";
import {
  DEFAULT_RADIUS_METERS,
  LocationSearchInput,
  RadiusSlider,
  RadiusMapCanvas,
  type LatLng,
  type MapResult,
} from "./RadiusMapPicker";

function toMapResults(results: SourceResult[]): MapResult[] {
  return results
    .filter((r): r is SourceResult & { lat: number; lng: number } => r.lat != null && r.lng != null)
    .map((r) => ({
      placeId: r.placeId,
      company: r.company,
      address: r.address,
      website: r.website,
      lat: r.lat,
      lng: r.lng,
    }));
}

export default function SourceSearchForm({
  onSearch,
  searching,
  results,
}: {
  onSearch: (params: SourceSearchParams) => void;
  searching: boolean;
  results: SourceResult[];
}) {
  const [query, setQuery] = useState("");
  const [center, setCenter] = useState<LatLng | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(DEFAULT_RADIUS_METERS);
  const [focusVersion, setFocusVersion] = useState(0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !center) return;
    onSearch({ query: query.trim(), lat: center.lat, lng: center.lng, radiusMeters });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-56">
          <Label>Keyword / category</Label>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. marketing agency"
            autoFocus
          />
        </div>
        <div className="w-64">
          <Label>Location</Label>
          <LocationSearchInput
            onPlaceSelected={(loc) => {
              setCenter(loc);
              setFocusVersion((v) => v + 1);
            }}
          />
        </div>
        <div>
          <Label>Radius</Label>
          <div className="pt-1.5">
            <RadiusSlider
              radiusMeters={radiusMeters}
              onRadiusChange={(m) => {
                setRadiusMeters(m);
                setFocusVersion((v) => v + 1);
              }}
            />
          </div>
        </div>
        <Button type="submit" disabled={searching || !query.trim() || !center}>
          {searching ? "Searching…" : "Search Google Maps"}
        </Button>
      </div>

      <RadiusMapCanvas
        center={center}
        radiusMeters={radiusMeters}
        focusVersion={focusVersion}
        results={toMapResults(results)}
        onCenterChange={setCenter}
        className="h-[400px] w-full"
      />
    </form>
  );
}
