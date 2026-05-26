// Customer skill-level LOV.
// Single source of truth shared by the customers list, detail page, and new-customer form.
//
// Stored in customers.category as the lowercase `value`. Nullable - a customer
// without a category just means "not yet rated", which is the default until
// admin sets one.

export type CustomerCategoryValue =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "competitive";

export type CustomerCategory = {
  value: CustomerCategoryValue;
  label: string;        // What admin sees in the select
  short: string;        // Compact pill label
  blurb: string;        // Tooltip-style helper text
  text: string;         // CSS color for the badge text
  bg: string;           // CSS color for the badge background
  border: string;       // CSS color for the badge border
};

export const CUSTOMER_CATEGORIES: readonly CustomerCategory[] = [
  {
    value: "beginner",
    label: "Beginner",
    short: "Beginner",
    blurb: "New to padel. Learning the basics.",
    text: "#0369a1",
    bg: "rgba(3,105,161,0.10)",
    border: "rgba(3,105,161,0.22)",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    short: "Intermediate",
    blurb: "Plays regularly. Comfortable with the rules and basic shots.",
    text: "#15803d",
    bg: "rgba(22,163,74,0.10)",
    border: "rgba(22,163,74,0.22)",
  },
  {
    value: "advanced",
    label: "Advanced",
    short: "Advanced",
    blurb: "Strong club-level player. Solid technique, plays tactically.",
    text: "#b45309",
    bg: "rgba(217,119,6,0.10)",
    border: "rgba(217,119,6,0.22)",
  },
  {
    value: "competitive",
    label: "Competitive",
    short: "Competitive",
    blurb: "Tournament-level player. Top of the club.",
    text: "#b91c1c",
    bg: "rgba(185,28,28,0.10)",
    border: "rgba(185,28,28,0.22)",
  },
] as const;

const BY_VALUE: Record<string, CustomerCategory> = Object.fromEntries(
  CUSTOMER_CATEGORIES.map((c) => [c.value, c]),
);

/**
 * Resolve a raw DB value to a category, or null if unset / unknown.
 * Treats whitespace and case-mismatch gracefully so old data doesn't break.
 */
export function resolveCategory(
  raw: string | null | undefined,
): CustomerCategory | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return BY_VALUE[key] ?? null;
}

/**
 * Coerce a form value to a storable category, or null for "uncategorised".
 * Anything that isn't in the LOV becomes null - we never store junk.
 */
export function normalizeCategoryInput(
  raw: FormDataEntryValue | null | undefined,
): CustomerCategoryValue | null {
  if (raw === null || raw === undefined) return null;
  const key = String(raw).trim().toLowerCase();
  return BY_VALUE[key] ? (key as CustomerCategoryValue) : null;
}
