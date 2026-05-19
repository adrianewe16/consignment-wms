# Consignment WMS

A warehouse management system for consignment dealers built with Next.js 16, Supabase, and Tailwind CSS.

## Setup

### 1. Supabase
1. Create a new Supabase project named `consignment-wms`
2. Run the SQL in `supabase/schema.sql` in the SQL editor
3. Copy your project URL and anon key

### 2. Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run locally
```bash
npm install
npm run dev
```

### 4. Deploy to Vercel
- Connect this GitHub repo to a new Vercel project
- Add the env vars in Vercel dashboard
- Deploy

## Features
- **Inventory tab**: Remaining stock (INs minus OUTs), Stock/Show filter, replenishment signals
- **Timeline tab**: Movement ledger with date presets, type/product filters, PDF export
- **Reconciliation tab**: FIFO aging buckets (0-30, 31-60, 61-90, >90 days), value at SRP, top 5 best sellers
- **Multi-SKU Stock In**: Batch multiple SKUs under one ST number
- **Stock Take PDF**: Portrait A4, stock units + show units on separate pages, signature rows
- **Movement PDF**: IN green / OUT red, date range header
- **Password-protected deletes**: Password `3913` required for all delete actions
- **Shared product catalog**: Upload once via CSV, applies to all dealers

## CSV Upload Format
```csv
sku,name,category,srp
SKU001,Product Name,Category,1500
```
