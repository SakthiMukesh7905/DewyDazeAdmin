import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly in dev so a missing .env.local doesn't silently break uploads/inserts
  // eslint-disable-next-line no-console
  console.error(
    'Missing Supabase environment variables. Did you create a .env.local file ' +
      'from .env.example and restart the dev server?'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Centralized constants so table/bucket names are never hand-typed in multiple places
export const PRODUCTS_TABLE = 'products';
export const PRODUCT_IMAGES_BUCKET = 'product-images';
