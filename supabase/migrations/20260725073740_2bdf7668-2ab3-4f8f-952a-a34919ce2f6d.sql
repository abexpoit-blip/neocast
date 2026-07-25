ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS exp_month text,
  ADD COLUMN IF NOT EXISTS exp_year text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS zip text,
  ADD COLUMN IF NOT EXISTS has_phone boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS refundable boolean NOT NULL DEFAULT false;