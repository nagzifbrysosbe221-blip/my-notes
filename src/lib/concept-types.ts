import type { ConceptType } from "@prisma/client";

/**
 * Central list of allowed concept types as defined in Prisma schema.
 */
export const CONCEPT_TYPE_VALUES: readonly ConceptType[] = [
  "CORE",
  "INTERMEDIATE",
  "ADVANCED",
  "PERIPHERAL",
  "MISC",
] as const;

export function normalizeConceptType(value?: string | null): ConceptType | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return CONCEPT_TYPE_VALUES.includes(normalized as ConceptType) ? (normalized as ConceptType) : null;
}

export function parseConceptTypeList(csv?: string | null): ConceptType[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((part) => normalizeConceptType(part))
    .filter((type): type is ConceptType => Boolean(type));
}
