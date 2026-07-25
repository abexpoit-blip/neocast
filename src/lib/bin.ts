export interface BinInfo {
  bin: string;
  brand: string | null;
  type: string | null;
  level: string | null;
  bank: string | null;
  country: string | null;
  countryName: string | null;
  currency: string | null;
  source: string;
}

const memo = new Map<string, BinInfo>();

/** Accurate BIN lookup via our server endpoint (external providers + cache). */
export const lookupBin = async (raw: string): Promise<BinInfo | null> => {
  const bin = raw.replace(/\D/g, "").slice(0, 8);
  if (bin.length < 6) return null;
  const cached = memo.get(bin);
  if (cached) return cached;
  try {
    const res = await fetch(`/api/public/bin/${bin}`);
    if (!res.ok) return null;
    const data = (await res.json()) as BinInfo;
    memo.set(bin, data);
    return data;
  } catch {
    return null;
  }
};
