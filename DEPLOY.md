# Deployment Guide — Consignment WMS

## Step 1: Create Supabase Project

1. Go to https://supabase.com → New Project
2. Name: `consignment-wms`
3. Choose region closest to Thailand (Singapore)
4. Set a strong database password (save it!)
5. Once created, go to **Settings → API**
6. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key

## Step 2: Run the Schema

1. In Supabase → **SQL Editor** → New Query
2. Paste the contents of `supabase/schema.sql`
3. Click **Run**

## Step 3: Create GitHub Repo

```bash
# Install GitHub CLI if needed: https://cli.github.com/
gh auth login

# Create private repo and push
gh repo create consignment-wms --private --source=. --remote=origin --push
```

Or manually:
1. Go to https://github.com/new
2. Name: `consignment-wms`, set **Private**
3. Don't initialize (repo has code already)
4. Then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/consignment-wms.git
git push -u origin main
```

## Step 4: Deploy to Vercel

1. Go to https://vercel.com → New Project
2. Import from GitHub → select `consignment-wms`
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
4. Click **Deploy**

### Or via CLI:
```bash
vercel login
vercel --prod
# Answer prompts: new project, name = consignment-wms
# Add env vars when prompted
```

## Step 5: Verify

- Open your Vercel URL
- Add a dealer, upload a CSV, test Stock In/Out
- Confirm PDFs generate correctly

## Local Development

```bash
cp .env.local.example .env.local
# Fill in your Supabase URL and key
npm install
npm run dev
# Open http://localhost:3000
```

## CSV Upload Format

```csv
sku,name,category,srp
BAS-001,Basel Watch 38mm,Watches,45000
BAS-002,Basel Watch 42mm,Watches,52000
STR-001,Strap Leather Brown,Accessories,2500
```

Columns: `sku`, `name`, `category`, `srp`
- **sku**: unique product code (required)
- **name**: product display name (required)
- **category**: optional grouping label
- **srp**: suggested retail price in THB

Upserts on SKU — existing products are updated, not duplicated.
