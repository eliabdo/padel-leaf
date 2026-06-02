// Shared payment metadata used by both the confirmation email
// (lib/email.ts) and the on-screen confirmation page
// (app/book/confirmation/[id]/page.tsx).
//
// Single source of truth — change the phone number here and it
// updates everywhere.

export const PAYMENT_PHONE = "+961 710 050";

export type PaymentMethod = "venue" | "whish" | "omt";

export const PAY_FULL_LABEL: Record<PaymentMethod, string> = {
  venue: "Pay at the venue",
  whish: "Whish",
  omt:   "OMT Pay",
};

/** True for methods that need the customer to send money before arrival. */
export function requiresPrepayment(m: PaymentMethod): boolean {
  return m === "whish" || m === "omt";
}
