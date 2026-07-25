ALTER TABLE public.deposits
  ADD COLUMN IF NOT EXISTS fee_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS charged_amount numeric,
  ADD COLUMN IF NOT EXISTS invoice_url text,
  ADD COLUMN IF NOT EXISTS tx_url text,
  ADD COLUMN IF NOT EXISTS received_amount text,
  ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;

CREATE INDEX IF NOT EXISTS deposits_invoice_id_idx ON public.deposits (invoice_id);
CREATE INDEX IF NOT EXISTS deposits_status_idx ON public.deposits (status);

-- expire stale pending crypto deposits automatically when touched
CREATE OR REPLACE FUNCTION public.expire_stale_deposits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n integer;
BEGIN
  UPDATE deposits
     SET status = 'rejected',
         admin_note = COALESCE(admin_note, 'Expired: not paid within window')
   WHERE status = 'pending'
     AND method = 'crypto'
     AND expires_at IS NOT NULL
     AND expires_at < now();
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;