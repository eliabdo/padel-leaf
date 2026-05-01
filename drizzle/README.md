# Drizzle migrations

`drizzle-kit` will generate timestamped SQL files in this folder when you run `npm run db:generate` after schema changes.

The pre-existing file here is **not** auto-generated:

- **`0001_overlap_constraint.sql`** — adds the Postgres `EXCLUDE` constraint that prevents double-booking at the database level. Drizzle can't express this in TypeScript yet, so it's hand-written. Run it once after `db:push`.
