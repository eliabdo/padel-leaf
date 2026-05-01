# Padel Leaf

Outdoor padel club website + booking system for **Padel Leaf** — three courts in Mezher, Bsalim, Mount Lebanon.

Built with Next.js 16 (App Router), Tailwind v4, Neon Postgres, Drizzle ORM, and a tiny custom admin auth (bcrypt + cookie session — no NextAuth needed for one user).

---

## What's in v1

- **Marketing site:** Home, About, Courts (Laurel / Oak / Olive), Pricing, Find Us, Contact, Terms, Privacy
- **Booking flow:** date strip → court → duration (60/90/120 min) → time → name/email/phone → on-screen confirmation + .ics calendar download
- **Pay-at-venue** at $20/hour. No Stripe in v1.
- **Admin dashboard** at `/admin` — today's view, all bookings, customers, contact messages, block-outs (rain/maintenance), pricing edit, manual booking add/remove

Everything intentionally cut from v1 lives in [BACKLOG.md](./BACKLOG.md).

---

## First-time setup (one-time, ~10 minutes)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up (free tier is plenty).
2. Create a project — name it "padel-leaf".
3. Copy the **Connection string** (it looks like `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`).

### 3. Set up your admin password

Generate a bcrypt hash for the password you'll use to sign in to `/admin`:

```bash
npm run admin:hash -- "the-password-you-want"
```

This prints a line like `ADMIN_PASSWORD_HASH=$2a$10$...`. Copy it.

### 4. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:
- `DATABASE_URL` — the Neon connection string from step 2
- `ADMIN_PASSWORD_HASH` — the line you just generated
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — your WhatsApp number (international, no `+`, e.g. `96170123456`)

### 5. Push schema + seed

```bash
npm run db:push        # creates the tables in Neon from lib/schema.ts
npm run db:seed        # inserts the 3 courts and the $20/hr pricing rule
```

### 6. Apply the double-booking constraint

This is a **one-time** Postgres-specific protection that drizzle-kit can't generate automatically:

Open the Neon SQL Editor in your project dashboard and paste the contents of `drizzle/0001_overlap_constraint.sql`. Run it.

(Or with `psql`: `psql "$DATABASE_URL" -f drizzle/0001_overlap_constraint.sql`)

### 7. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — public site.
Open [http://localhost:3000/admin](http://localhost:3000/admin) — sign in with the password from step 3.

---

## Deploy to Vercel

1. Push this folder to a new GitHub repo (Vercel needs Git).
2. Go to [vercel.com](https://vercel.com), click **Add New → Project**, pick the repo.
3. **Root directory:** leave as `.` (this folder is already the root)
4. **Environment variables:** add the same three from `.env.local`:
   - `DATABASE_URL`
   - `ADMIN_PASSWORD_HASH`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`
5. Click **Deploy**. You'll get a `padel-leaf.vercel.app`-style URL within ~2 minutes.

Every push to your GitHub repo will redeploy automatically. Branches get preview URLs.

---

## Project structure

```
padel-leaf/
├── app/                       # Next.js App Router
│   ├── page.tsx               # Home
│   ├── about/                 # The Club
│   ├── courts/                # 3 courts page
│   ├── pricing/               # $20/hr + cancellation policy
│   ├── find-us/               # Map + WhatsApp
│   ├── contact/               # Contact form
│   ├── book/                  # Booking flow + confirmation
│   ├── admin/                 # Staff dashboard (protected)
│   ├── api/                   # Route handlers (booking, contact, .ics)
│   ├── components/            # Nav, Footer, Marquee, SectionHeader
│   ├── globals.css            # Brand tokens via @theme
│   └── layout.tsx             # Fonts (Playfair + Inter), metadata
├── lib/
│   ├── db.ts                  # Drizzle client (Neon)
│   ├── schema.ts              # Tables
│   ├── booking.ts             # Slot generation, time helpers
│   ├── pricing.ts             # Hourly rate lookup, formatting
│   └── session.ts             # Admin cookie session
├── drizzle/                   # SQL migrations (auto + manual)
├── scripts/
│   ├── seed.ts                # Seed 3 courts + pricing rule
│   └── hash-password.ts       # Generate bcrypt admin hash
├── public/
│   └── logo.jpg               # The club crest
├── middleware.ts              # Bounces unauthed traffic away from /admin
├── BACKLOG.md                 # v2 features parked here
└── _reference_index.html      # The original Lovable design — for reference only
```

---

## Brand reference

- **Colors:** Forest `#025A03` · Sage `#B5E6BD` · Cream `#F7F4EC` · Charcoal `#1A1A1A` · Clay `#C46A3D`
- **Typography:** Playfair Display (display) + Inter (UI/body)
- **Voice:** Confident, understated, club-not-gym. "Reserve a court," not "Book now!!"

---

## What's intentionally NOT here

If you find yourself missing memberships, online payments, open matches, the journal, coaches, or the mobile app — they're in [BACKLOG.md](./BACKLOG.md). v1 is deliberately tight.
