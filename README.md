# GEM Imports eBay Reseller Dashboard

A focused product-research and purchase-planning dashboard for sourcing wholesale
products from GEM Imports and assessing their resale potential on eBay.

## Features

- Reseller overview with ROI and profit metrics
- Searchable and sortable GEM Imports catalogue
- Automatic UK VAT and unit-cost calculations
- eBay research and sold-listing links
- Live profit, margin, ROI, and break-even calculator
- Price and availability history
- Product notes and a persistent purchase planner
- Responsive dark interface

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Production

[gem-reseller-dashboard.vercel.app](https://gem-reseller-dashboard.vercel.app)

## Stack

React, TypeScript, Tailwind CSS, TanStack Table, React Query, Recharts, and Vite.

## Supabase

The normalized schema, row-level security policies, and indexes live in
`supabase/migrations`. Apply them to a linked project with:

```bash
npx supabase db push
```

No placeholder products or analytics are seeded.
