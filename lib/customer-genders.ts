// Customer gender LOV.
// Same shape as customer-categories so the wiring (resolveGender,
// normalizeGenderInput, the select, the badge) all reads identically.
//
// Stored in customers.gender as the lowercase `value`. Nullable - a customer
// without a gender just means "not specified", which is the default.

export type CustomerGenderValue = "male" | "female";

export type CustomerGender = {
  value: CustomerGenderValue;
  label: string;
  short: string;
  blurb: string;
  text: string;
  bg: string;
  border: string;
};

export const CUSTOMER_GENDERS: readonly CustomerGender[] = [
  {
    value: "male",
    label: "Male",
    short: "M",
    blurb: "",
    text: "#1d4ed8",
    bg: "rgba(37,99,235,0.10)",
    border: "rgba(37,99,235,0.22)",
  },
  {
    value: "female",
    label: "Female",
    short: "F",
    blurb: "",
    text: "#be185d",
    bg: "rgba(219,39,119,0.10)",
    border: "rgba(219,39,119,0.22)",
  },
] as const;

const BY_VALUE: Record<string, CustomerGender> = Object.fromEntries(
  CUSTOMER_GENDERS.map((g) => [g.value, g]),
);

/**
 * Resolve a raw DB value to a gender, or null if unset / unknown.
 */
export function resolveGender(
  raw: string | null | undefined,
): CustomerGender | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return BY_VALUE[key] ?? null;
}

/**
 * Coerce a form value to a storable gender, or null for "not specified".
 */
export function normalizeGenderInput(
  raw: FormDataEntryValue | null | undefined,
): CustomerGenderValue | null {
  if (raw === null || raw === undefined) return null;
  const key = String(raw).trim().toLowerCase();
  return BY_VALUE[key] ? (key as CustomerGenderValue) : null;
}
