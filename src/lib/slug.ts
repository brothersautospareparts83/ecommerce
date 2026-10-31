/** URL-safe slug: lower-case, a-z0-9 and hyphens only. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Upper-case alphanumerics only, matching the database function normalize_part_number(). */
export function normalizePartNumber(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
