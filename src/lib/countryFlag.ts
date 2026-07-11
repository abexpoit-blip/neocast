// ISO 3166-1 alpha-2 country code → flag emoji + friendly name.
// Falls back to the code itself when unknown.

const NAMES: Record<string, string> = {
  US: "United States", CA: "Canada", GB: "United Kingdom", UK: "United Kingdom",
  AU: "Australia", DE: "Germany", FR: "France", IT: "Italy", ES: "Spain",
  NL: "Netherlands", BE: "Belgium", CH: "Switzerland", AT: "Austria",
  SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland", IE: "Ireland",
  PT: "Portugal", GR: "Greece", PL: "Poland", CZ: "Czech Republic",
  RO: "Romania", HU: "Hungary", BG: "Bulgaria", HR: "Croatia", SK: "Slovakia",
  RU: "Russia", UA: "Ukraine", TR: "Turkey", IL: "Israel", AE: "UAE",
  SA: "Saudi Arabia", QA: "Qatar", KW: "Kuwait", BH: "Bahrain", OM: "Oman",
  EG: "Egypt", ZA: "South Africa", NG: "Nigeria", KE: "Kenya", MA: "Morocco",
  MX: "Mexico", BR: "Brazil", AR: "Argentina", CL: "Chile", CO: "Colombia",
  PE: "Peru", VE: "Venezuela", EC: "Ecuador", UY: "Uruguay",
  JP: "Japan", KR: "South Korea", CN: "China", HK: "Hong Kong", TW: "Taiwan",
  SG: "Singapore", MY: "Malaysia", TH: "Thailand", ID: "Indonesia",
  PH: "Philippines", VN: "Vietnam", IN: "India", PK: "Pakistan",
  BD: "Bangladesh", LK: "Sri Lanka", NP: "Nepal", NZ: "New Zealand",
};

/** Convert an ISO2 code (e.g. "US") to the flag emoji (🇺🇸). */
export function toFlag(code?: string | null): string {
  if (!code) return "🏳️";
  const c = code.trim().toUpperCase();
  if (c.length !== 2 || !/^[A-Z]{2}$/.test(c)) return "🏳️";
  // 🇦 = U+1F1E6; offset from 'A'
  const base = 0x1f1e6 - 65;
  return String.fromCodePoint(base + c.charCodeAt(0)) +
         String.fromCodePoint(base + c.charCodeAt(1));
}

export function countryName(code?: string | null): string {
  if (!code) return "Unknown";
  const c = code.trim().toUpperCase();
  return NAMES[c] ?? c;
}
