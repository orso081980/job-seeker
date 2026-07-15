import { useEffect, useRef, useState } from "react";
import {
  Map,
  AdvancedMarker,
  Circle,
  InfoWindow,
  Pin,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

export const DEFAULT_CENTER = { lat: 50.8503, lng: 4.3517 }; // Brussels
export const DEFAULT_RADIUS_METERS = 10000;
export const MIN_RADIUS_KM = 1;
export const MAX_RADIUS_KM = 50;

export type LatLng = { lat: number; lng: number };

export type MapResult = {
  placeId: string;
  company: string;
  address: string;
  website: string;
  lat: number;
  lng: number;
};

export function LocationSearchInput({
  onPlaceSelected,
}: {
  onPlaceSelected: (loc: LatLng) => void;
}) {
  const places = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!places || !inputRef.current) return;
    const autocomplete = new places.Autocomplete(inputRef.current, { fields: ["geometry"] });
    const listener = autocomplete.addListener("place_changed", () => {
      const loc = autocomplete.getPlace().geometry?.location;
      if (loc) onPlaceSelected({ lat: loc.lat(), lng: loc.lng() });
    });
    return () => listener.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places]);

  return (
    <input
      ref={inputRef}
      placeholder="Search a city, address or area…"
      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 dark:border-white/10 dark:bg-white/5"
    />
  );
}

export function RadiusSlider({
  radiusMeters,
  onRadiusChange,
}: {
  radiusMeters: number;
  onRadiusChange: (radiusMeters: number) => void;
}) {
  const [radiusKm, setRadiusKm] = useState(radiusMeters / 1000);

  useEffect(() => {
    setRadiusKm(radiusMeters / 1000);
  }, [radiusMeters]);

  return (
    <div className="flex items-center gap-2.5">
      <input
        type="range"
        min={MIN_RADIUS_KM}
        max={MAX_RADIUS_KM}
        step={1}
        value={radiusKm}
        onChange={(e) => {
          const km = Number(e.target.value);
          setRadiusKm(km);
          onRadiusChange(km * 1000);
        }}
        className="h-1.5 w-32 cursor-pointer appearance-none rounded-full bg-gray-200 accent-brand-600 dark:bg-white/10"
      />
      <span className="w-14 shrink-0 rounded-md bg-brand-50 px-1.5 py-0.5 text-center text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
        {radiusKm} km
      </span>
    </div>
  );
}

/** Re-fits the map viewport to the circle whenever `focusVersion` changes. */
function FitBoundsOnFocus({
  center,
  radiusMeters,
  focusVersion,
}: {
  center: LatLng | null;
  radiusMeters: number;
  focusVersion: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !center) return;
    const circle = new google.maps.Circle({ center, radius: radiusMeters });
    const bounds = circle.getBounds();
    if (bounds) map.fitBounds(bounds, 32);
    // Deliberately re-fits only on a fresh focus (search selection / radius change),
    // not on every center update, so dragging the marker doesn't yank the viewport.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, focusVersion]);

  return null;
}

function ResultMarker({
  result,
  selected,
  onSelect,
}: {
  result: MapResult;
  selected: boolean;
  onSelect: (placeId: string | null) => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: result.lat, lng: result.lng }}
        onClick={() => onSelect(selected ? null : result.placeId)}
      >
        <Pin background="#111827" borderColor="#111827" glyphColor="#ffffff" scale={0.8} />
      </AdvancedMarker>
      {selected && marker && (
        <InfoWindow anchor={marker} onCloseClick={() => onSelect(null)}>
          <div className="max-w-[220px] space-y-1 p-1">
            <p className="text-sm font-semibold text-gray-900">{result.company}</p>
            {result.address && <p className="text-xs text-gray-500">{result.address}</p>}
            {result.website && (
              <a
                href={result.website}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs font-medium text-brand-700 hover:underline"
              >
                Open website ↗
              </a>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function RadiusMapCanvas({
  center,
  radiusMeters,
  focusVersion,
  results = [],
  onCenterChange,
  className = "",
}: {
  center: LatLng | null;
  radiusMeters: number;
  focusVersion: number;
  results?: MapResult[];
  onCenterChange: (center: LatLng) => void;
  className?: string;
}) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-white/10 ${className}`}
    >
      <Map
        mapId="DEMO_MAP_ID"
        defaultCenter={center ?? DEFAULT_CENTER}
        center={center ?? undefined}
        defaultZoom={11}
        gestureHandling="cooperative"
        zoomControl
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        className="h-full w-full"
        onClick={(e) => {
          if (e.detail.latLng) onCenterChange(e.detail.latLng);
        }}
      >
        <FitBoundsOnFocus center={center} radiusMeters={radiusMeters} focusVersion={focusVersion} />
        {center && (
          <>
            <AdvancedMarker
              position={center}
              draggable
              onDragEnd={(e) => {
                const pos = e.latLng;
                if (pos) onCenterChange({ lat: pos.lat(), lng: pos.lng() });
              }}
            />
            <Circle
              center={center}
              radius={radiusMeters}
              fillColor="#4f46e5"
              fillOpacity={0.08}
              strokeColor="#4f46e5"
              strokeOpacity={0.6}
              strokeWeight={1.5}
            />
          </>
        )}
        {results.map((r) => (
          <ResultMarker
            key={r.placeId}
            result={r}
            selected={selectedPlaceId === r.placeId}
            onSelect={setSelectedPlaceId}
          />
        ))}
      </Map>
      {!center && (
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/50 to-transparent px-4 py-3">
          <p className="text-xs font-medium text-white">
            Search a location above, or click the map to set the search center
          </p>
        </div>
      )}
    </div>
  );
}
