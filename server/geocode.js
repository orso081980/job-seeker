const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

export async function geocodeAddress(address) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !address) return { city: "", country: "" };

  try {
    const url = `${GEOCODE_URL}?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));

    if (data.status !== "OK" || !data.results?.length) {
      if (data.status && data.status !== "ZERO_RESULTS") {
        console.warn(`Geocoding API returned ${data.status} for "${address}": ${data.error_message ?? ""}`);
      }
      return { city: "", country: "" };
    }

    const components = data.results[0].address_components ?? [];
    const find = (types) =>
      components.find((c) => types.some((t) => c.types.includes(t)))?.long_name ?? "";

    return {
      city: find(["locality", "postal_town", "administrative_area_level_2"]),
      country: find(["country"]),
    };
  } catch (e) {
    console.warn(`Geocoding request failed for "${address}":`, e.message);
    return { city: "", country: "" };
  }
}
