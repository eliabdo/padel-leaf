# Padel Leaf — v2 Backlog

Everything we explicitly cut from v1. Captured here so we don't forget the good ideas.

## Payments
- Online payment via Stripe Checkout (replace pay-at-venue)
- Apple Pay / Google Pay (auto-enabled with Stripe)
- Local Lebanese payment methods (Whish, OMT) if regulars expect them
- Card-on-file → enforce same-day cancellation fees automatically
- Refunds via Stripe (admin button)
- 8-minute slot hold during checkout (only meaningful with online payments)

## Memberships
- Three-tier membership page (Visitor / Regular / Club)
- Stripe subscriptions for monthly billing
- Member-only pricing auto-applied at booking
- Priority booking window (members 14 days, public 7 days)
- Guest passes per month
- Session packs (buy 5 / 10 hours upfront)

## User accounts
- Email + Google sign-in (NextAuth or Clerk)
- "My account" dashboard — upcoming + past bookings, saved card
- Player profile — photo, skill level (1–7), preferred play times
- Preferred partners list

## Community
- Open matches — post a slot, others join, split the cost
- Skill-level filtering for matches
- Match history & stats
- Tournament registration & brackets
- Club leaderboard / ranking

## Content
- Journal / blog ("Notes from the club")
- Coaches page with bios, lesson rates, booking link
- Tournaments landing page
- Pro shop (when one exists)

## Communications
- Booking confirmation email (Resend)
- 24h reminder email
- Cancellation confirmation email
- SMS reminders (Twilio, ~$0.04/msg)
- Push notifications (mobile only)
- Newsletter / monthly note

## Localization & polish
- Arabic localization toggle (next-intl)
- Dark mode (only if it ever fits the cream-and-forest aesthetic)
- Recurring bookings ("every Tuesday 19:00 for 4 weeks")
- Multi-court bookings for corporate events
- Reports: revenue by week/month, court utilization %
- Rich admin broadcast (email blast to all customers)

## Mobile app
- Native iOS + Android via Expo (re-uses the web backend)
- Apple/Google sign-in, Apple Pay / Google Pay
- Push reminders + open-match alerts
- Soft launch via TestFlight to regulars first
