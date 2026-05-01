-- Run this AFTER `npm run db:push` (which creates the tables from the Drizzle schema).
--
-- This adds the bulletproof double-booking protection: Postgres will refuse
-- to insert any booking that overlaps with an existing confirmed one on the
-- same court. Same protection covers block-outs vs bookings.
--
-- Run via: psql $DATABASE_URL -f drizzle/0001_overlap_constraint.sql
-- (Or paste into the Neon SQL Editor.)

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Stop two confirmed bookings from overlapping on the same court.
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_no_overlap;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    court_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  )
  WHERE (status = 'confirmed');

-- Stop two block-outs from overlapping on the same court (admin sanity).
ALTER TABLE block_outs
  DROP CONSTRAINT IF EXISTS block_outs_no_overlap;

ALTER TABLE block_outs
  ADD CONSTRAINT block_outs_no_overlap
  EXCLUDE USING gist (
    court_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  );
