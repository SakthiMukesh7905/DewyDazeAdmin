# Dewy Daze — Admin Dashboard

A minimal internal admin tool for managing the `products` catalog: add new
products with photos, and view/delete existing inventory. Built with React,
Material UI, and `@supabase/supabase-js`.

## 1. Project setup

```bash
npm install
```

## 2. Supabase setup

1. In the Supabase SQL Editor, run `sql/schema.sql`. This creates:
   - the `products` table with the exact schema this app expects
   - the `product-images` public storage bucket
   - permissive RLS policies so the anon key can read/write (see the note in
     that file about tightening this once you add an admin login)
2. Go to **Project Settings → API** and copy your **Project URL** and
   **anon public key**.

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-public-key
GENERATE_SOURCEMAP=false
ADMIN_USERNAME=dewydazeadmin
ADMIN_PASSWORD=Magic@20262005
AUTH_SECRET=your-long-random-secret
```

Create React App only reads env vars prefixed with `REACT_APP_`, and only
picks up `.env.local` changes after a dev server restart.

> Do not commit your real admin password or secret to source control.

## 4. Run it

```bash
npm start
```

Opens at `http://localhost:3000`.

## How the pieces fit together

- **`src/supabaseClient.js`** — single Supabase client instance, exported
  alongside the table/bucket name constants so they're never hardcoded twice.
- **`src/components/ProductForm.jsx`** — the add-product form. Image inputs
  upload immediately on selection (`supabase.storage.from('product-images').upload()`),
  then store the `getPublicUrl()` result in form state. Submitting the form
  does a single `supabase.from('products').insert([...])`.
- **`src/components/ProductList.jsx`** — fetches all rows on mount via
  `useEffect` + `supabase.from('products').select('*')`, renders them in a
  table, and deletes a row via `supabase.from('products').delete().eq('id', id)`
  after a confirmation dialog.
- **`src/App.jsx`** — lays out the form and table side by side and wires a
  simple "refresh signal" so the table re-fetches right after a save.

## Notes / next steps

- Deleting a product removes the database row but **not** the underlying
  files in the `product-images` bucket — add a storage `.remove()` call in
  `ProductList.jsx`'s `handleDelete` if you want those cleaned up too.
- There's no authentication screen here — anyone with the URL can use this
  exactly as a logged-in admin would. Put it behind Supabase Auth (or even
  just a basic password gate) before sharing the link outside your team.
- Price is stored as `numeric(10,2)`; the UI assumes INR (₹) — change the
  symbol in `ProductForm.jsx` and `ProductList.jsx` if needed.
