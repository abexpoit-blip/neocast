/** TXT export format used for delivered card orders. */
export const CARD_TXT_HEADER =
  "base|prices|cc|month|year|cvv|name|addr|city|state|zip|country|tel|email|ip|ua";

export interface CardTxtFields {
  base?: string | null;
  price?: number | string | null;
  cc?: string | null;
  month?: string | null;
  year?: string | null;
  cvv?: string | null;
  name?: string | null;
  addr?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  tel?: string | null;
  email?: string | null;
  ip?: string | null;
  ua?: string | null;
}

const v = (x: unknown) => (x == null ? "" : String(x).trim());

export const formatCardTxtLine = (f: CardTxtFields): string =>
  [
    v(f.base),
    f.price == null || f.price === "" ? "" : Number(f.price).toFixed(2).replace(/\.00$/, ""),
    v(f.cc),
    v(f.month),
    v(f.year),
    v(f.cvv),
    v(f.name),
    v(f.addr),
    v(f.city),
    v(f.state),
    v(f.zip),
    v(f.country),
    v(f.tel),
    v(f.email),
    v(f.ip),
    v(f.ua),
  ].join("|");

/** A delivered_content line already in pipe format (10+ fields) is used as-is. */
export const isPipeLine = (line: string) => line.split("|").length >= 10;
