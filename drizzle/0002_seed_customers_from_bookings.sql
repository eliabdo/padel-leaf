-- Backfill the new customers table from existing booking history.
-- Safe to re-run: ON CONFLICT DO NOTHING.
-- Run this AFTER `npm run db:push` adds the customers table.
--
-- For each unique customer email in bookings, pick the most recent
-- name/phone (so we get the latest values the customer used), and mark
-- the row as source='booking' so we can tell these apart from manual adds.

INSERT INTO customers (email, name, phone, source, created_at)
SELECT
  lower(customer_email)                                   AS email,
  -- "latest name" = name from the most-recent booking
  (ARRAY_AGG(customer_name ORDER BY starts_at DESC))[1]   AS name,
  (ARRAY_AGG(customer_phone ORDER BY starts_at DESC))[1]  AS phone,
  'booking'                                               AS source,
  MIN(created_at)                                         AS created_at
FROM bookings
WHERE customer_email IS NOT NULL AND customer_email <> ''
GROUP BY lower(customer_email)
ON CONFLICT (email) DO NOTHING;
