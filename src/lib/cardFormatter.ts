// Auto-formats messy card lines into the canonical pipe format:
// cc|month/year|cvv|name|addr|city|state|zip|country|tel|email
// Missing fields are emitted as the literal "null".

export type ParsedCard = {
  cc: string; month: string; year: string; cvv: string;
  name: string; addr: string; city: string; state: string;
  zip: string; country: string; tel: string; email: string;
};

const NULLISH = new Set(["", "null", "n/a", "na", "none", "-", "undefined"]);
const norm = (s: string) => (NULLISH.has(s.trim().toLowerCase()) ? "null" : s.trim());

const isCC = (s: string) => /^\d{12,19}$/.test(s.replace(/\s|-/g, ""));
const isCVV = (s: string) => /^\d{3,4}$/.test(s);
const isMonth = (s: string) => /^(0?[1-9]|1[0-2])$/.test(s);
const isYear = (s: string) => /^(\d{2}|20\d{2})$/.test(s);
const isMMYY = (s: string) => /^(0?[1-9]|1[0-2])\s*[\/\-]\s*(\d{2}|20\d{2})$/.test(s);
const isZip = (s: string) => /^[A-Z0-9][A-Z0-9\s-]{2,9}$/i.test(s);
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isPhone = (s: string) => /^[+()\d][\d\s\-().]{6,}$/.test(s) && /\d{6,}/.test(s.replace(/\D/g, ""));
const isCountry2 = (s: string) => /^[A-Z]{2}$/.test(s);
const isCountryFull = (s: string) => /^[A-Za-z\s]{4,30}$/.test(s) && !/\d/.test(s);

export function detectBrand(cc: string): string {
  const n = cc.replace(/\D/g, "");
  if (/^4/.test(n)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "MASTERCARD";
  if (/^3[47]/.test(n)) return "AMEX";
  if (/^6(011|5|4[4-9])/.test(n)) return "DISCOVER";
  if (/^35/.test(n)) return "JCB";
  if (/^3(0[0-5]|[68])/.test(n)) return "DINERS";
  return "OTHER";
}

/** Strip common label prefixes like "Address:", "City:", etc. */
function stripLabel(s: string): string {
  return s.replace(/^(address|addr|street|city|town|state|province|zip|zipcode|postal ?code|country|phone|tel|mobile|email|mail|name|holder|fullname|full name|cardholder|cc|card|number|cardnumber|exp|expiry|expiration|month|mm|year|yy|yyyy|cvv|cvc|cvv2|code)\s*[:=]\s*/i, "").trim();
}

const COUNTRY_MAP: Record<string, string> = {
  "united states": "US", "united states of america": "US", usa: "US", "u.s.a": "US", america: "US",
  "united kingdom": "GB", uk: "GB", england: "GB", britain: "GB", "great britain": "GB",
  canada: "CA", australia: "AU", germany: "DE", deutschland: "DE", france: "FR", spain: "ES",
  italy: "IT", netherlands: "NL", holland: "NL", belgium: "BE", sweden: "SE", norway: "NO",
  denmark: "DK", finland: "FI", ireland: "IE", poland: "PL", portugal: "PT", austria: "AT",
  switzerland: "CH", mexico: "MX", brazil: "BR", japan: "JP", china: "CN", india: "IN",
  russia: "RU", turkey: "TR", "south africa": "ZA", "new zealand": "NZ", singapore: "SG",
  "united arab emirates": "AE", uae: "AE", bangladesh: "BD", pakistan: "PK", indonesia: "ID",
  philippines: "PH", thailand: "TH", vietnam: "VN", malaysia: "MY", romania: "RO", greece: "GR",
  "czech republic": "CZ", hungary: "HU", ukraine: "UA", israel: "IL", "saudi arabia": "SA",
  argentina: "AR", chile: "CL", colombia: "CO", peru: "PE",
};

/** Normalise country names/codes to ISO-2 when possible. */
export function normCountry(v: string): string {
  const s = v.trim();
  if (!s || s.toLowerCase() === "null") return "null";
  if (/^[A-Za-z]{2}$/.test(s)) return s.toUpperCase();
  const hit = COUNTRY_MAP[s.toLowerCase().replace(/\./g, "")];
  return hit ?? s.toUpperCase();
}

/** Normalise expiry pieces: accepts 1, 01, 2028, 28, 1228, 122028. */
function normExp(month: string, year: string): { month: string; year: string } {
  let m = month.replace(/\D/g, "");
  let y = year.replace(/\D/g, "");
  if (!y && (m.length === 4 || m.length === 6)) { y = m.slice(2); m = m.slice(0, 2); }
  if (y.length === 4) y = y.slice(2);
  if (y.length === 1) y = "0" + y;
  if (m.length === 1) m = "0" + m;
  return { month: m || "null", year: y || "null" };
}

/** "12/28", "1228", "12-2028", "122028" → month + year */
function parseExpBlob(s: string): { month: string; year: string } | null {
  const t = s.trim();
  const sep = t.match(/^(\d{1,2})\s*[\/\-.\s]\s*(\d{2}|\d{4})$/);
  if (sep) return normExp(sep[1], sep[2]);
  const digits = t.replace(/\D/g, "");
  if ((digits.length === 4 || digits.length === 6) && /^(0?[1-9]|1[0-2])/.test(digits)) {
    return normExp(digits.slice(0, 2), digits.slice(2));
  }
  return null;
}

const LABEL_KEYS: Record<string, keyof ParsedCard> = {
  cc: "cc", card: "cc", number: "cc", cardnumber: "cc", "card number": "cc", pan: "cc",
  cvv: "cvv", cvc: "cvv", cvv2: "cvv", code: "cvv", seccode: "cvv",
  name: "name", holder: "name", cardholder: "name", fullname: "name", "full name": "name",
  address: "addr", addr: "addr", street: "addr",
  city: "city", town: "city",
  state: "state", province: "state", region: "state",
  zip: "zip", zipcode: "zip", "zip code": "zip", postal: "zip", "postal code": "zip", postcode: "zip",
  country: "country",
  phone: "tel", tel: "tel", mobile: "tel", telephone: "tel",
  email: "email", mail: "email", "e-mail": "email",
  month: "month", mm: "month", exp_month: "month",
  year: "year", yy: "year", yyyy: "year", exp_year: "year",
};

/** Parse "Key: value" style lines (space, comma or pipe separated pairs). */
function parseLabeled(line: string): ParsedCard | null {
  const re = /([A-Za-z][A-Za-z _-]{1,14})\s*[:=]\s*([^|,;\n]*?)(?=\s+[A-Za-z][A-Za-z _-]{1,14}\s*[:=]|[|,;]|$)/g;
  const out: ParsedCard = {
    cc: "null", month: "null", year: "null", cvv: "null", name: "null", addr: "null",
    city: "null", state: "null", zip: "null", country: "null", tel: "null", email: "null",
  };
  let hits = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const rawKey = m[1].trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
    const value = m[2].trim();
    if (!value) continue;
    if (/^(exp|expiry|expiration|expires|exp date|valid|valid thru)$/.test(rawKey)) {
      const e = parseExpBlob(value);
      if (e) { out.month = e.month; out.year = e.year; hits++; }
      continue;
    }
    const key = LABEL_KEYS[rawKey] ?? LABEL_KEYS[rawKey.replace(/\s/g, "")];
    if (!key) continue;
    out[key] = norm(value);
    hits++;
  }
  if (hits < 3 || out.cc === "null") return null;
  out.cc = out.cc.replace(/[\s-]/g, "");
  if (!isCC(out.cc)) return null;
  if (out.month !== "null" || out.year !== "null") {
    const e = normExp(out.month === "null" ? "" : out.month, out.year === "null" ? "" : out.year);
    out.month = e.month; out.year = e.year;
  }
  out.country = normCountry(out.country);
  return out;
}

/** Whitespace-only lines: extract by regex, leftovers become name/addr/city. */
function parseLoose(line: string): ParsedCard | null {
  let s = ` ${line.trim()} `;
  const out: ParsedCard = {
    cc: "null", month: "null", year: "null", cvv: "null", name: "null", addr: "null",
    city: "null", state: "null", zip: "null", country: "null", tel: "null", email: "null",
  };
  const grab = (re: RegExp): string | null => {
    const m = s.match(re);
    if (!m) return null;
    s = s.replace(m[0], " ");
    return m[0].trim();
  };

  const email = grab(/[^\s@|,;]+@[^\s@|,;]+\.[A-Za-z]{2,}/);
  if (email) out.email = email;

  const cc = grab(/(?<![\d-])(?:\d[ -]?){12,19}(?![\d-])/);
  if (!cc) return null;
  out.cc = cc.replace(/[\s-]/g, "");
  if (!isCC(out.cc)) return null;

  const exp = grab(/(?<!\d)(0?[1-9]|1[0-2])\s*[\/\-.]\s*(\d{4}|\d{2})(?!\d)/) ?? grab(/(?<!\d)(0[1-9]|1[0-2])(\d{2}|20\d{2})(?!\d)/);
  if (exp) {
    const e = parseExpBlob(exp);
    if (e) { out.month = e.month; out.year = e.year; }
  }

  const tel = grab(/(?<![\d@.])(?:\+\d[\d\s().-]{8,}|\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})(?![\d])/);
  if (tel) out.tel = tel;

  const cvv = grab(/(?<!\d)\d{3,4}(?!\d)/);
  if (cvv) out.cvv = cvv;

  const zip = grab(/(?<![\w-])\d{5}(?:-\d{4})?(?![\w-])/);
  if (zip) out.zip = zip;

  const tokens = s.trim().split(/\s+/).filter(Boolean);
  // Trailing country
  if (tokens.length) {
    const last = tokens[tokens.length - 1];
    if (/^[A-Za-z]{2}$/.test(last) || COUNTRY_MAP[last.toLowerCase()]) {
      out.country = normCountry(last); tokens.pop();
    } else if (tokens.length >= 2 && COUNTRY_MAP[`${tokens[tokens.length - 2]} ${last}`.toLowerCase()]) {
      out.country = normCountry(`${tokens[tokens.length - 2]} ${last}`); tokens.pop(); tokens.pop();
    }
  }
  // Trailing state (2-letter upper)
  if (tokens.length && /^[A-Za-z]{2}$/.test(tokens[tokens.length - 1])) {
    out.state = tokens.pop()!.toUpperCase();
  }
  // Remaining: name (first 2 words) | address (middle) | city (last word)
  if (tokens.length >= 2) out.name = `${tokens.shift()} ${tokens.shift()}`;
  else if (tokens.length === 1) out.name = tokens.shift()!;
  if (tokens.length >= 2) out.city = tokens.pop()!;
  if (tokens.length) out.addr = tokens.join(" ");
  return out;
}

/** Split a single line by the most likely delimiter. */
function splitLine(line: string): string[] {
  for (const d of ["|", "\t", ";", ",", ":"]) {
    if (line.includes(d)) {
      return line.split(d).map((s) => stripLabel(s.trim()));
    }
  }
  return line.trim().split(/\s{2,}/).map((s) => stripLabel(s.trim()));
}


/**
 * Smart parser that handles:
 * - Standard format: cc|month|year|cvv|name|addr|city|state|zip|country|tel|email
 * - Labeled fields: "Address: 123 Main St", "City: Boston"
 * - Duplicate fields (e.g. double country, double address) — takes first occurrence
 * - Base/price prefixes stripped automatically
 * - MM/YY combined expiry fields
 */
/**
 * Remove duplicate consecutive field blocks.
 * E.g. cc|mm|yy|cvv|name|addr|city|state|zip|country|addr|city|state|zip|country|tel|email
 * The duplicated addr..country block is removed, keeping the first occurrence.
 */
function deduplicateFields(parts: string[]): string[] {
  // Find the CC index to know where data fields start
  const ccIdx = parts.findIndex((p) => isCC(p.replace(/\s|-/g, "")));
  if (ccIdx === -1) return parts;

  // Fields after cc/month/year/cvv/name start at ccIdx+5
  const dataStart = ccIdx + 5;
  if (dataStart >= parts.length) return parts;

  const dataFields = parts.slice(dataStart);
  // Look for a repeated subsequence: try window sizes 3-6
  for (let winSize = 3; winSize <= 6; winSize++) {
    if (dataFields.length < winSize * 2) continue;
    // Check if fields [0..winSize-1] repeat at [winSize..2*winSize-1]
    for (let start = 0; start <= dataFields.length - winSize * 2; start++) {
      let match = true;
      for (let k = 0; k < winSize; k++) {
        if (dataFields[start + k].toLowerCase() !== dataFields[start + winSize + k].toLowerCase()) {
          match = false;
          break;
        }
      }
      if (match) {
        // Remove the duplicate block
        const newData = [...dataFields.slice(0, start + winSize), ...dataFields.slice(start + winSize * 2)];
        return [...parts.slice(0, dataStart), ...newData];
      }
    }
  }
  return parts;
}

export function parseCardLine(raw: string): ParsedCard | null {
  const line = raw.trim();
  if (!line) return null;

  // Skip header lines
  if (/^(base|cc|card|number)\s*[|,;\t]/i.test(line)) return null;
  if (/^\s*(cc|card)?\s*number\b.*\b(cvv|exp)/i.test(line) && !/\d{12}/.test(line)) return null;

  // Strategy 1: labeled "Key: value" input
  const labeled = parseLabeled(line);
  if (labeled) return labeled;

  let parts = splitLine(line).filter((p) => p.length > 0);
  if (parts.length === 0) return null;

  // Strategy 2: no usable delimiters — space separated free text
  if (parts.length < 3) {
    const loose = parseLoose(line);
    if (loose) return loose;
  }


  // Handle prefix format: base|prices|cc|month|year|cvv|...
  if (parts.length >= 3 && /[_$]/.test(parts[0]) && !isCC(parts[0].replace(/\s|-/g, ""))) {
    const maybePrice = parts[1];
    if (/^\$?\d+(\.\d+)?$/.test(maybePrice)) {
      parts = parts.slice(2);
    } else {
      parts = parts.slice(1);
    }
  }

  // Remove trailing price field(s)
  while (parts.length > 0) {
    const lastField = parts[parts.length - 1];
    if (lastField && /^\$?\d+(\.\d+)?\$?$/.test(lastField)) {
      parts = parts.slice(0, -1);
    } else break;
  }

  // Deduplicate: when input has labeled + unlabeled duplicate fields
  // (e.g. "Address: 123 Main|City: Denver|...|123 Main|Denver|...")
  // detect the repeated block and remove it.
  if (parts.length > 13) {
    parts = deduplicateFields(parts);
  }

  const out: ParsedCard = {
    cc: "null", month: "null", year: "null", cvv: "null",
    name: "null", addr: "null", city: "null", state: "null",
    zip: "null", country: "null", tel: "null", email: "null",
  };

  // Fast path: already in canonical order (12+ fields starting with cc, month, year)
  if (parts.length >= 12 && isCC(parts[0]) && isMonth(parts[1]) && isYear(parts[2])) {
    return {
      cc: norm(parts[0].replace(/\s|-/g, "")),
      month: norm(parts[1].padStart(2, "0")),
      year: norm(parts[2].length === 4 ? parts[2].slice(2) : parts[2]),
      cvv: norm(parts[3] ?? "null"),
      name: norm(parts[4] ?? "null"),
      addr: norm(parts[5] ?? "null"),
      city: norm(parts[6] ?? "null"),
      state: norm(parts[7] ?? "null"),
      zip: norm(parts[8] ?? "null"),
      country: norm(parts[9] ?? "null"),
      tel: norm(parts[10] ?? "null"),
      email: norm(parts[11] ?? "null"),
    };
  }

  // Fast path: cc|MM/YY|cvv|name|addr|city|state|zip|country|tel|email (11 fields with combined expiry)
  if (parts.length >= 11 && isCC(parts[0]) && isMMYY(parts[1])) {
    const [mm, yy] = parts[1].split(/[\/\-]/);
    return {
      cc: norm(parts[0].replace(/\s|-/g, "")),
      month: norm(mm.padStart(2, "0")),
      year: norm(yy.length === 4 ? yy.slice(2) : yy),
      cvv: norm(parts[2] ?? "null"),
      name: norm(parts[3] ?? "null"),
      addr: norm(parts[4] ?? "null"),
      city: norm(parts[5] ?? "null"),
      state: norm(parts[6] ?? "null"),
      zip: norm(parts[7] ?? "null"),
      country: norm(parts[8] ?? "null"),
      tel: norm(parts[9] ?? "null"),
      email: norm(parts[10] ?? "null"),
    };
  }

  const used = new Set<number>();
  const take = (i: number, val: string) => { used.add(i); return norm(val); };

  // 1. Credit card number
  const ccIdx = parts.findIndex((p) => isCC(p.replace(/\s|-/g, "")));
  if (ccIdx === -1) return null;
  out.cc = take(ccIdx, parts[ccIdx].replace(/\s|-/g, ""));

  // 2. Month / year — check for MM/YY combo at next index, else two separate
  const next = parts[ccIdx + 1];
  const blob = next ? parseExpBlob(next) : null;
  if (next && (isMMYY(next) || (blob && /^\d{4,6}$/.test(next.replace(/\D/g, ""))))) {
    const e = blob ?? { month: "null", year: "null" };
    used.add(ccIdx + 1);
    out.month = e.month; out.year = e.year;
  } else {
    const mIdx = parts.findIndex((p, i) => !used.has(i) && i > ccIdx && isMonth(p));
    if (mIdx !== -1) out.month = take(mIdx, parts[mIdx].padStart(2, "0"));
    const yIdx = parts.findIndex((p, i) => !used.has(i) && i > ccIdx && isYear(p));
    if (yIdx !== -1) {
      const y = parts[yIdx];
      out.year = take(yIdx, y.length === 4 ? y.slice(2) : y);
    }
  }


  // 3. CVV — first 3-4 digit chunk after CC that isn't month/year
  const cvvIdx = parts.findIndex((p, i) => !used.has(i) && i > ccIdx && isCVV(p));
  if (cvvIdx !== -1) out.cvv = take(cvvIdx, parts[cvvIdx]);

  // 4. Email
  const emIdx = parts.findIndex((p, i) => !used.has(i) && isEmail(p));
  if (emIdx !== -1) out.email = take(emIdx, parts[emIdx]);

  // 5. Phone
  const telIdx = parts.findIndex((p, i) => !used.has(i) && isPhone(p));
  if (telIdx !== -1) out.tel = take(telIdx, parts[telIdx]);

  // 6. Country — prefer 2-letter code, then full country name (take FIRST occurrence only)
  const ctIdx = parts.findIndex((p, i) => !used.has(i) && isCountry2(p.toUpperCase()));
  if (ctIdx !== -1) {
    out.country = take(ctIdx, parts[ctIdx].toUpperCase());
    // Mark any duplicate country fields as used so they're skipped
    parts.forEach((p, i) => {
      if (!used.has(i) && (isCountry2(p.toUpperCase()) || p.toUpperCase() === out.country)) {
        used.add(i);
      }
    });
  } else {
    // Try full country name — find first match, mark duplicates
    const fullCtIdx = parts.findIndex((p, i) => !used.has(i) && isCountryFull(p) && p.length >= 4);
    if (fullCtIdx !== -1) {
      const countryVal = parts[fullCtIdx].toUpperCase();
      out.country = take(fullCtIdx, parts[fullCtIdx]);
      // Mark duplicates
      parts.forEach((p, i) => {
        if (!used.has(i) && p.toUpperCase() === countryVal) {
          used.add(i);
        }
      });
    }
  }

  // 7. Remaining tokens: name, addr, city, state, zip in order
  const remaining = parts.map((p, i) => ({ p, i })).filter(({ i }) => !used.has(i));

  // ZIP — short alphanumeric 3-10 chars, prefer ones with digits
  const zipPick = remaining.find(({ p }) => isZip(p) && /\d/.test(p) && p.length <= 10);
  if (zipPick) { out.zip = take(zipPick.i, zipPick.p); }

  const rest = remaining.filter(({ i }) => !used.has(i));

  // Name = first remaining with letters and spaces (likely "John Smith")
  const nameIdx = rest.findIndex(({ p }) => /^[A-Za-z][A-Za-z\s.'-]{2,}$/.test(p) && p.includes(" "));
  if (nameIdx !== -1) {
    const item = rest[nameIdx]; out.name = take(item.i, item.p); rest.splice(nameIdx, 1);
  } else if (rest.length > 0 && /^[A-Za-z]/.test(rest[0].p)) {
    const item = rest.shift()!; out.name = take(item.i, item.p);
  }

  // Address = next remaining with digits + letters (likely "123 Main St")
  const addrIdx = rest.findIndex(({ p }) => /\d/.test(p) && /[A-Za-z]/.test(p) && p.length > 5);
  if (addrIdx !== -1) {
    const item = rest[addrIdx]; out.addr = take(item.i, item.p); rest.splice(addrIdx, 1);
    // Mark duplicate address fields
    rest.forEach((r, ri) => {
      if (!used.has(r.i) && r.p === item.p) { used.add(r.i); rest.splice(ri, 1); }
    });
  } else if (rest.length > 0) {
    const item = rest.shift()!; out.addr = take(item.i, item.p);
  }

  // State = short upper (2-3 letters)
  const stIdx = rest.findIndex(({ p }) => /^[A-Z]{2,3}$/.test(p));
  if (stIdx !== -1) {
    const item = rest[stIdx]; out.state = take(item.i, item.p); rest.splice(stIdx, 1);
  }

  // City = first remaining string-only token
  const cityIdx = rest.findIndex(({ p }) => /^[A-Za-z][A-Za-z\s.'-]+$/.test(p));
  if (cityIdx !== -1) {
    const item = rest[cityIdx]; out.city = take(item.i, item.p); rest.splice(cityIdx, 1);
  } else if (rest.length > 0) {
    const item = rest.shift()!; out.city = take(item.i, item.p);
  }

  // If state is still null and city was set, fall back: scan unused for 2-letter
  if (out.state === "null") {
    const fallback = rest.find(({ p }) => /^[A-Za-z]{2,3}$/.test(p));
    if (fallback) out.state = take(fallback.i, fallback.p);
  }

  out.country = normCountry(out.country);
  const e = normExp(out.month === "null" ? "" : out.month, out.year === "null" ? "" : out.year);
  out.month = e.month; out.year = e.year;
  return out;

}

/** Output in upload/fixer format: cc|month/year|cvv|name|addr|city|state|zip|country|tel|email */
export function toPipeFormat(card: ParsedCard): string {
  const expiry = `${card.month}/${card.year}`;
  return `${card.cc}|${expiry}|${card.cvv}|${card.name}|${card.addr}|${card.city}|${card.state}|${card.zip}|${card.country}|${card.tel}|${card.email}`;
}

export function parseAndFormat(input: string): { lines: ParsedCard[]; output: string; failed: string[] } {
  const lines: ParsedCard[] = [];
  const failed: string[] = [];
  for (const raw of input.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    let parsed = parseCardLine(raw);
    if (!parsed || parsed.cc === "null") parsed = parseLoose(raw);
    if (parsed && parsed.cc !== "null" && isCC(parsed.cc)) lines.push(parsed);
    else failed.push(raw);
  }
  return { lines, output: lines.map(toPipeFormat).join("\n"), failed };
}

/** Dedupe by full card number. */
export function dedupe(cards: ParsedCard[]): { unique: ParsedCard[]; dropped: number } {
  const seen = new Set<string>();
  const unique: ParsedCard[] = [];
  for (const c of cards) {
    if (seen.has(c.cc)) continue;
    seen.add(c.cc);
    unique.push(c);
  }
  return { unique, dropped: cards.length - unique.length };
}
