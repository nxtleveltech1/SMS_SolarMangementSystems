# SolarFlow setup

## Neon (database)

A Neon project **SolarFlow** was created via MCP.

- **Project ID:** `shiny-flower-12721204`
- **Branch:** `main` (default)
- **Database:** `neondb`

Schema has been applied and seed data (organizations, sites, devices, site_memberships) is in place.

### Connection string

1. Get the connection string:
   - **Neon MCP:** Call `get_connection_string` with `projectId: "shiny-flower-12721204"`.
   - **Neon Console:** [console.neon.tech](https://console.neon.tech) → project **SolarFlow** → Connection string (use the **pooled** URL).
2. Add to `.env.local`:
   ```env
   DATABASE_URL="postgresql://...?sslmode=require"
   ```
   Use the **pooled** URL (host contains `-pooler`) for the app.

### Optional: run migrations/seed from this repo

With `DATABASE_URL` set in `.env.local`:

```bash
bun run db:migrate
bun run db:seed
```

## Clerk (auth)

Clerk is fully integrated with **custom sign-in/sign-up pages** (no pre-built Clerk components).

### Create a Clerk application

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) and sign in or create an account.
2. Create a new application (e.g. **SolarFlow**).
3. In **Configure → API Keys**, copy:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY`
4. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
5. (Optional) In **User & Authentication → Email, Phone, Username**, enable the methods you want (e.g. Email + Password for the custom forms).

### After first sign-up

Site access is controlled by `site_memberships` (Clerk user ID → site + role). To grant a user access:

- Add a row in `site_memberships` with their Clerk user ID (from Clerk Dashboard or after they sign in) and the desired `site_id` and `role` (`homeowner`, `operator`, or `admin`), or
- Implement an invite/onboarding flow that inserts into `site_memberships` when you assign sites to users.

Seed data includes demo memberships for `local-dev-user`; replace or add rows for real Clerk user IDs as needed.
