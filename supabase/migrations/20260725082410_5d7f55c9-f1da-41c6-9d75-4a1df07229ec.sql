ALTER TABLE public.deposits
  ADD COLUMN IF NOT EXISTS invoice_id text,
  ADD COLUMN IF NOT EXISTS wallet_address text,
  ADD COLUMN IF NOT EXISTS crypto_amount text,
  ADD COLUMN IF NOT EXISTS crypto_currency text,
  ADD COLUMN IF NOT EXISTS confirmations integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS txid text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS deposits_invoice_id_key ON public.deposits (invoice_id) WHERE invoice_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.settle_crypto_deposit(
  _invoice_id text,
  _status text,
  _confirmations integer DEFAULT 0,
  _txid text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _d RECORD;
BEGIN
  SELECT * INTO _d FROM deposits WHERE invoice_id = _invoice_id FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;

  UPDATE deposits
     SET confirmations = GREATEST(COALESCE(_confirmations,0), deposits.confirmations),
         txid = COALESCE(_txid, deposits.txid)
   WHERE id = _d.id;

  IF _d.status = 'approved' THEN RETURN 'already_approved'; END IF;

  IF _status = 'approved' THEN
    UPDATE profiles SET balance = balance + _d.amount WHERE id = _d.user_id;
    INSERT INTO balance_transactions (user_id, amount, kind, description)
    VALUES (_d.user_id, _d.amount, 'deposit', 'Crypto deposit confirmed');
    UPDATE deposits SET status = 'approved' WHERE id = _d.id;
    RETURN 'approved';
  ELSIF _status IN ('rejected','expired','cancelled') THEN
    UPDATE deposits SET status = 'rejected' WHERE id = _d.id;
    RETURN 'rejected';
  END IF;

  RETURN 'pending';
END;
$$;

REVOKE ALL ON FUNCTION public.settle_crypto_deposit(text, text, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_crypto_deposit(text, text, integer, text) TO service_role;