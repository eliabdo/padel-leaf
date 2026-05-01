import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Courts — fixed at 3 for v1: Laurel, Oak, Olive.
 */
export const courts = pgTable("courts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),          // "Laurel", "Oak", "Olive"
  surface: text("surface").notNull(),     // "Synthetic clay" etc.
  hasLights: boolean("has_lights").notNull().default(true),
  photoUrl: text("photo_url"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

/**
 * Bookings — created the moment a customer confirms.
 * Pay-at-venue in v1, so status moves: confirmed -> completed | cancelled | no_show.
 *
 * Double-booking is prevented at the DB level via an EXCLUDE constraint
 * defined in drizzle/0001_overlap_constraint.sql (see /drizzle/).
 */
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  courtId: integer("court_id").notNull().references(() => courts.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(), // 60 / 90 / 120
  totalCents: integer("total_cents").notNull(),
  status: text("status").notNull().default("confirmed"),  // confirmed | cancelled | completed | no_show
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  paymentMethod: text("payment_method").notNull().default("venue"), // venue | whish | omt
  paymentReceivedAt: timestamp("payment_received_at", { withTimezone: true }),
});

/**
 * Block-outs — admin-set unavailability (rain, maintenance).
 * Same overlap-with-bookings logic via EXCLUDE constraint.
 */
export const blockOuts = pgTable("block_outs", {
  id: serial("id").primaryKey(),
  courtId: integer("court_id").notNull().references(() => courts.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Pricing rules — single row in v1 (flat $20/hour).
 * Schema is generic enough to handle peak/off-peak later without migration.
 */
export const pricingRules = pgTable("pricing_rules", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),                 // "Standard"
  hourlyRateCents: integer("hourly_rate_cents").notNull(), // 2000 = $20.00
  dayOfWeek: integer("day_of_week"),              // 0-6, NULL = all days
  startTime: text("start_time"),                  // "07:00" or NULL = all day
  endTime: text("end_time"),                      // "23:00" or NULL = all day
  active: boolean("active").notNull().default(true),
});

/**
 * Contact form submissions — viewed in /admin/messages instead of emailed.
 * Eli wanted no comms in v1, so the inbox lives in the dashboard.
 */
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
});

/**
 * Admin sessions — random tokens stored server-side for /admin auth.
 * Replaces NextAuth for v1 simplicity (one user, one password).
 */
export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: serial("id").primaryKey(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("admin_sessions_token_idx").on(table.token),
  }),
);

export type Court = typeof courts.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BlockOut = typeof blockOuts.$inferSelect;
export type PricingRule = typeof pricingRules.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;

/**
 * Revenue items — manual line items added by admin (e.g. shop sales, lessons).
 * Completed bookings are the primary revenue source; these supplement them.
 */
export const revenueItems = pgTable("revenue_items", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),              // e.g. "Equipment rental", "Lesson fee"
  amountCents: integer("amount_cents").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RevenueItem = typeof revenueItems.$inferSelect;
