REVOKE ALL ON FUNCTION public.expire_stale_deposits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_deposits() TO service_role;
REVOKE ALL ON FUNCTION public.settle_crypto_deposit(text, text, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_crypto_deposit(text, text, integer, text) TO service_role;