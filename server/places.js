const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.googleMapsUri",
  "places.primaryTypeDisplayName",
  "places.location",
  "nextPageToken",
].join(",");

const MAX_RADIUS_METERS = 50000;
const EARTH_RADIUS_METERS = 6371000;

function distanceMeters(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

export async function searchPlaces({ query, lat, lng, radiusMeters, pageToken }) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY is not configured on the server. Add it to your .env file."
    );
  }
  if (typeof lat !== "number" || typeof lng !== "number" || !radiusMeters) {
    throw new Error("lat, lng, and radiusMeters are required");
  }
  const clampedRadius = Math.min(radiusMeters, MAX_RADIUS_METERS);

  const body = {
    textQuery: query,
    languageCode: "en",
    maxResultCount: 20,
    // Text Search's `locationRestriction` only accepts a rectangle, not a circle -- a
    // circle can only be used as a soft `locationBias`. We bias here, then hard-filter
    // by actual distance below so results are still strictly within the chosen radius.
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: clampedRadius,
      },
    },
  };
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message ?? `Places API request failed (${res.status})`;
    throw new Error(message);
  }

  const center = { lat, lng };
  const places = (data.places ?? [])
    .filter((p) => p.location && distanceMeters(center, { lat: p.location.latitude, lng: p.location.longitude }) <= clampedRadius)
    .map((p) => ({
      placeId: p.id ?? "",
      company: p.displayName?.text ?? "",
      website: p.websiteUri ?? "",
      address: p.formattedAddress ?? "",
      phone: p.nationalPhoneNumber ?? "",
      industry: p.primaryTypeDisplayName?.text ?? "",
      mapsUrl: p.googleMapsUri ?? "",
      lat: p.location.latitude,
      lng: p.location.longitude,
    }));

  return { places, nextPageToken: data.nextPageToken ?? null };
}
