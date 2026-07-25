ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS bin text,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS base text;

CREATE INDEX IF NOT EXISTS products_bin_idx ON public.products (bin);
CREATE INDEX IF NOT EXISTS products_brand_idx ON public.products (brand);
CREATE INDEX IF NOT EXISTS products_country_idx ON public.products (country);