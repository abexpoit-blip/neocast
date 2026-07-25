ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.sync_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _pid uuid;
BEGIN
  _pid := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE products p SET stock = (
    SELECT count(*) FROM product_keys k WHERE k.product_id = _pid AND k.is_sold = false
  ) WHERE p.id = _pid;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_keys_stock
AFTER INSERT OR UPDATE OR DELETE ON public.product_keys
FOR EACH ROW EXECUTE FUNCTION public.sync_product_stock();

UPDATE public.products p SET stock = (
  SELECT count(*) FROM public.product_keys k WHERE k.product_id = p.id AND k.is_sold = false
);