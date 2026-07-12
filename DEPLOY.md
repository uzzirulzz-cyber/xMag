# MaGx World Super IPTV — Vercel Deployment

Production deployment guide for the MaGx World Super IPTV reseller panel.

## Prerequisites

- A [Vercel](https://vercel.com) account
- The GitHub repo `uzzirulzz-cyber/xMag` pushed (see below)
- A MongoDB Atlas cluster (already configured at `cluster0.mfghk5u.mongodb.net`)

## 1. Push to GitHub first

The sandbox cannot push for you (no GitHub credentials). From your local machine:

```bash
git clone <this-project> magx-panel
cd magx-panel
git remote add origin https://github.com/uzzirulzz-cyber/xMag.git
git push -u origin main
```

## 2. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `uzzirulzz-cyber/xMag` repository
3. Framework preset: **Next.js** (auto-detected)
4. Build command: `next build` (auto)
5. Install command: `bun install` (or `npm install`)

## 3. Add environment variables

In the Vercel project → **Settings → Environment Variables**, add all 11:

| Key | Value | Environments |
|-----|-------|--------------|
| `DATABASE_URL` | `mongodb+srv://max11:••••@cluster0.mfghk5u.mongodb.net/stariptv?retryWrites=true&w=majority&appName=Cluster0` | Production, Preview, Development |
| `JAZZCASH_TOKEN_1` | `Ab_aBQ-cWw7sD-...` | All |
| `JAZZCASH_TOKEN_2` | `EEH0oo-zIctPx...` | All |
| `ADMIN_ACCOUNT_TITLE` | `MUHAMMAD UZAIR` | All |
| `ADMIN_BANK_NAME` | `Bank Alfalah` | All |
| `ADMIN_ACCOUNT_NUMBER` | `03361010537701` | All |
| `ADMIN_IBAN` | `PK52ALFH0336001010537701` | All |
| `ADMIN_SWIFT` | `ALFHPKKAXXX` | All |
| `ADMIN_BRANCH` | `E-11 MARKAZ BRANCH ISLAMABAD` | All |
| `ADMIN_BRANCH_CODE` | `0336` | All |
| `ADMIN_EASYPAISA` | `03390005715` | All |

> ⚠️ **Rotate the MongoDB password + JazzCash tokens** before deploying — they were shared in chat history.

## 4. MongoDB Atlas — allow Vercel IPs

MongoDB Atlas → **Network Access** → add `0.0.0.0/0` (allow from anywhere) so Vercel's serverless functions can connect. Alternatively, Vercel Pro teams can use a static IP range.

## 5. Deploy

Click **Deploy**. Vercel will:
1. Run `bun install` (or `npm install`)
2. Run `postinstall` → `prisma generate` (generates the Prisma Client)
3. Run `next build`
4. Deploy the Next.js app to a `*.vercel.app` URL

## 6. Seed the database (one-time)

After the first deploy, hit the seed endpoint once to populate demo data:

```bash
curl -X POST https://your-app.vercel.app/api/funds/seed
```

This creates: 1 reseller, 5 payment methods, 14 transactions, 42 content categories, 8 packages, 84 channels, 4 subscriptions, 7 connections, 8 notifications, 1 Xtream server, 1 bot config.

## Local development

```bash
bun install
bun run db:push     # sync schema to MongoDB
bun run seed        # seed demo data
bun run dev         # start dev server on :3000
```

## Notes

- The `output: "standalone"` was removed from `next.config.ts` — Vercel handles output natively.
- `postinstall: prisma generate` ensures the Prisma Client is built during Vercel's install step.
- All API routes use `export const dynamic = 'force-dynamic'` so they run as serverless functions.
- The Xtream proxy (`/api/funds/xtream/*`) fetches from `geotv.space:8880` server-side — works on Vercel.
- The iptv-org integration fetches from `iptv-org.github.io` — works on Vercel.
- The auto-credit bot's 60s scheduler runs client-side (in the admin browser tab). For true background processing, add Vercel Cron or an external worker.
