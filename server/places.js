const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.googleMapsUri",
  "places.primaryTypeDisplayName",
  "nextPageToken",
].join(",");

export async function searchPlaces({ query, city, country, pageToken }) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY is not configured on the server. Add it to your .env file."
    );
  }

  const location = [city, country].filter(Boolean).join(", ");
  const textQuery = location ? `${query} in ${location}` : query;

  const body = { textQuery, languageCode: "en", maxResultCount: 20 };
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

  const places = (data.places ?? []).map((p) => ({
    placeId: p.id ?? "",
    company: p.displayName?.text ?? "",
    website: p.websiteUri ?? "",
    address: p.formattedAddress ?? "",
    phone: p.nationalPhoneNumber ?? "",
    industry: p.primaryTypeDisplayName?.text ?? "",
    mapsUrl: p.googleMapsUri ?? "",
  }));

  return { places, nextPageToken: data.nextPageToken ?? null };
}
