export function parseTechStack(notes: string): string[] {
  return notes
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
