import { geocodeAddress } from "./geocode.js";

export async function resolveLocationFromAddress(body) {
  if (body.city || body.country || !body.address) return body;
  const { city, country } = await geocodeAddress(body.address);
  return { ...body, city, country };
}

export function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function buildCompanyRecord(existingCompanies, body) {
  const baseId = slugify(body.company);
  let id = baseId;
  let n = 1;
  while (existingCompanies.some((c) => c.id === id)) {
    id = `${baseId}-${++n}`;
  }
  const now = new Date().toISOString();
  return {
    id,
    company: body.company,
    website: body.website,
    city: body.city ?? "",
    country: body.country ?? "",
    industry: body.industry ?? "",
    description: body.description ?? "",
    address: body.address ?? "",
    mapsUrl: body.mapsUrl ?? "",
    searchQuery: body.searchQuery ?? "",
    languages: body.languages ?? "",
    status: "new",
    rating: 0,
    notes: "",
    techStackNotes: "",
    projectUrl: "",
    githubUrl: "",
    contactName: body.contactName ?? "",
    contactEmail: body.contactEmail ?? "",
    contactPhone: body.contactPhone ?? "",
    contactLinkedIn: body.contactLinkedIn ?? "",
    hasJobPosting: Boolean(body.hasJobPosting),
    jobUrl: body.jobUrl ?? "",
    createdAt: now,
    updatedAt: now,
  };
}
