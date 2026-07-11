import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { useAuth } from "@/hooks/useAuth";
import { ArrowUpRight, ArrowRight } from "lucide-react";

/**
 * Public landing / home page.
 * Design: Paper & Ink editorial minimalism, Space Grotesk display + DM Sans body,
 * full-width stacked bands. No purple gradients, no glass, no neon.
 */
export default function Landing() {
  const { user } = useAuth();
  const primaryHref = user ? "/shop" : "/auth";
  const primaryLabel = user ? "Enter the shop" : "Create account";

  return (
    <div
      className="min-h-screen bg-[#f5f3ee] text-[#0d0d0d] antialiased selection:bg-[#0d0d0d] selection:text-[#f5f3ee]"
      style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
    >
      <Seo
        title="cruzercc.shop — Verified Gift Card & CC marketplace"
        description="A quiet, editorial marketplace for verified Gift Cards and CCs. Vault-grade trust, instant fulfillment, 40+ countries."
        path="/"
      />

      {/* NAV */}
      <header className="border-b border-[#e8e4dd]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 bg-[#0d0d0d]" />
            <span
              className="text-sm tracking-[0.24em] uppercase"
              style={{ fontFamily: '"Space Grotesk", sans-serif' }}
            >
              cruzercc
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.22em] text-[#4a4a4a]">
            <a href="#catalog" className="hover:text-[#0d0d0d] transition">Catalog</a>
            <a href="#trust" className="hover:text-[#0d0d0d] transition">Trust</a>
            <a href="#numbers" className="hover:text-[#0d0d0d] transition">Numbers</a>
            <a href="#rules" className="hover:text-[#0d0d0d] transition">Rules</a>
          </nav>
          <div className="flex items-center gap-3">
            {!user && (
              <Link
                to="/auth"
                className="hidden sm:inline text-xs uppercase tracking-[0.22em] text-[#4a4a4a] hover:text-[#0d0d0d] transition"
              >
                Sign in
              </Link>
            )}
            <Link
              to={primaryHref}
              className="inline-flex items-center gap-2 bg-[#0d0d0d] text-[#f5f3ee] px-4 py-2.5 text-xs uppercase tracking-[0.22em] hover:bg-[#2d2d2d] transition"
            >
              {primaryLabel} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-[#e8e4dd]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-40">
          <div className="text-[11px] uppercase tracking-[0.35em] text-[#4a4a4a] mb-10 flex items-center gap-3">
            <span className="h-px w-8 bg-[#0d0d0d]" /> Issue No. 011 · Est. 2023
          </div>
          <h1
            className="font-medium leading-[0.95] tracking-[-0.03em] text-[52px] sm:text-[92px] lg:text-[148px]"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            Cards, quietly<br />
            <span className="italic text-[#2d2d2d]">delivered.</span>
          </h1>
          <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <p className="lg:col-span-6 text-lg lg:text-xl leading-relaxed text-[#2d2d2d] max-w-xl">
              cruzercc.shop is a curated marketplace for verified Gift Cards and CCs.
              Every seller is vetted, every card validity-checked, every order delivered
              the moment payment clears.
            </p>
            <div className="lg:col-span-6 lg:col-start-8 flex flex-col justify-end gap-6">
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to={primaryHref}
                  className="group inline-flex items-center gap-3 bg-[#0d0d0d] text-[#f5f3ee] px-6 py-4 text-sm uppercase tracking-[0.22em] hover:bg-[#2d2d2d] transition"
                >
                  {primaryLabel}
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </Link>
                <a
                  href="#catalog"
                  className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-[#0d0d0d] border-b border-[#0d0d0d] pb-1 hover:text-[#4a4a4a] hover:border-[#4a4a4a] transition"
                >
                  Browse catalog
                </a>
              </div>
              <div className="grid grid-cols-3 border-t border-[#e8e4dd] pt-6 text-[#2d2d2d]">
                <MiniStat k="99.4%" v="Valid rate" />
                <MiniStat k="40+" v="Countries" />
                <MiniStat k="< 30s" v="Delivery" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG PREVIEW */}
      <section id="catalog" className="border-b border-[#e8e4dd] bg-[#e8e4dd]/40">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-32">
          <SectionHead num="01" eyebrow="Catalog" title="Six shelves. One vault." />
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#c9c4bb]">
            {[
              { name: "Visa Classic", tag: "US · EU · UK" },
              { name: "Mastercard World", tag: "40+ regions" },
              { name: "American Express", tag: "Green · Gold · Plat" },
              { name: "Discover", tag: "US issuers" },
              { name: "Amazon Gift", tag: "US · CA · UK · DE" },
              { name: "Steam Wallet", tag: "Global" },
            ].map((c, i) => (
              <Link
                to="/auth"
                key={c.name}
                className="group relative bg-[#f5f3ee] aspect-[4/3] p-8 flex flex-col justify-between hover:bg-[#0d0d0d] hover:text-[#f5f3ee] transition-colors duration-300"
              >
                <div className="flex items-start justify-between text-[10px] uppercase tracking-[0.3em] text-[#4a4a4a] group-hover:text-[#a1a1a1]">
                  <span>#{String(i + 1).padStart(2, "0")}</span>
                  <span>{c.tag}</span>
                </div>
                <div>
                  <h3
                    className="text-3xl lg:text-4xl font-medium tracking-[-0.02em]"
                    style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                  >
                    {c.name}
                  </h3>
                  <div className="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em]">
                    View shelf <ArrowUpRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section id="trust" className="border-b border-[#e8e4dd]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-32 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <SectionHead num="02" eyebrow="Trust" title="Why buyers stay." />
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-px bg-[#c9c4bb]">
            {[
              {
                t: "Vetted sellers",
                d: "Every seller manually reviewed. Track record enforced. No anonymous drops.",
              },
              {
                t: "Validity-checked",
                d: "Cards checked at intake. Auto-refund if invalid on first use, no ticket needed.",
              },
              {
                t: "Instant delivery",
                d: "Orders land in your dashboard the second payment clears. No waiting rooms.",
              },
            ].map((f, i) => (
              <div key={f.t} className="bg-[#f5f3ee] p-8">
                <div className="text-[10px] uppercase tracking-[0.3em] text-[#4a4a4a] mb-6">
                  0{i + 1}
                </div>
                <h4
                  className="text-2xl font-medium tracking-[-0.02em] mb-3"
                  style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                >
                  {f.t}
                </h4>
                <p className="text-sm leading-relaxed text-[#2d2d2d]">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NUMBERS BAND */}
      <section id="numbers" className="border-b border-[#e8e4dd] bg-[#0d0d0d] text-[#f5f3ee]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-32">
          <SectionHead num="03" eyebrow="The record" title="Numbers, unadorned." dark />
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-y-14 gap-x-8 border-t border-[#2d2d2d] pt-14">
            {[
              { k: "$4.2M", v: "Cards sold in 2025" },
              { k: "12,400+", v: "Verified buyers" },
              { k: "99.4%", v: "First-use valid rate" },
              { k: "27s", v: "Median delivery" },
            ].map((n) => (
              <div key={n.k}>
                <div
                  className="text-5xl lg:text-6xl font-medium tracking-[-0.02em]"
                  style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                >
                  {n.k}
                </div>
                <div className="mt-3 text-[11px] uppercase tracking-[0.3em] text-[#a1a1a1]">
                  {n.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RULES */}
      <section id="rules" className="border-b border-[#e8e4dd]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-32 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <SectionHead num="04" eyebrow="House rules" title="Short, and enforced." />
            <p className="mt-6 text-sm text-[#4a4a4a] max-w-sm leading-relaxed">
              By registering you accept the shop rules. They exist to protect
              honest buyers and sellers alike.
            </p>
          </div>
          <ol className="lg:col-span-8 divide-y divide-[#e8e4dd] border-t border-b border-[#e8e4dd]">
            {[
              "Save purchased cards immediately. Orders cannot be recovered after deletion.",
              "Account balance is non-refundable. Recharge responsibly.",
              "Exploiting vulnerabilities for profit results in a permanent ban.",
              "Report bugs through tickets. Bounties available for verified reports.",
              "Rules may change without prior notice — review periodically.",
            ].map((r, i) => (
              <li key={i} className="grid grid-cols-12 gap-4 py-6">
                <span className="col-span-2 text-[11px] uppercase tracking-[0.3em] text-[#4a4a4a] pt-1">
                  Rule {String(i + 1).padStart(2, "0")}
                </span>
                <span className="col-span-10 text-lg leading-snug text-[#0d0d0d]">
                  {r}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-[#e8e4dd]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-28 lg:py-40 text-center">
          <div className="text-[11px] uppercase tracking-[0.35em] text-[#4a4a4a] mb-8">
            Ready when you are
          </div>
          <h2
            className="font-medium leading-[0.95] tracking-[-0.03em] text-[44px] sm:text-[72px] lg:text-[112px] max-w-4xl mx-auto"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            Open an account.<br />
            <span className="italic text-[#2d2d2d]">Enter the vault.</span>
          </h2>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={primaryHref}
              className="inline-flex items-center gap-3 bg-[#0d0d0d] text-[#f5f3ee] px-8 py-5 text-sm uppercase tracking-[0.22em] hover:bg-[#2d2d2d] transition"
            >
              {primaryLabel} <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href="https://t.me/cruzercc_shop"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-[#0d0d0d] border-b border-[#0d0d0d] pb-1 hover:text-[#4a4a4a] hover:border-[#4a4a4a] transition"
            >
              Talk to us · @cruzercc_shop
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#f5f3ee]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[11px] uppercase tracking-[0.3em] text-[#4a4a4a]">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-[#0d0d0d]" />
            <span style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
              cruzercc.shop
            </span>
          </div>
          <div>© {new Date().getFullYear()} · All rights reserved</div>
          <div className="flex items-center gap-6">
            <Link to="/auth" className="hover:text-[#0d0d0d]">Sign in</Link>
            <a href="https://t.me/cruzercc_shop" target="_blank" rel="noreferrer" className="hover:text-[#0d0d0d]">Telegram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MiniStat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div
        className="text-xl lg:text-2xl font-medium tracking-[-0.02em] text-[#0d0d0d]"
        style={{ fontFamily: '"Space Grotesk", sans-serif' }}
      >
        {k}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-[#4a4a4a]">{v}</div>
    </div>
  );
}

function SectionHead({
  num,
  eyebrow,
  title,
  dark = false,
}: {
  num: string;
  eyebrow: string;
  title: string;
  dark?: boolean;
}) {
  const label = dark ? "text-[#a1a1a1]" : "text-[#4a4a4a]";
  const heading = dark ? "text-[#f5f3ee]" : "text-[#0d0d0d]";
  return (
    <div>
      <div className={`flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] ${label}`}>
        <span>{num}</span>
        <span className={`h-px w-8 ${dark ? "bg-[#a1a1a1]" : "bg-[#0d0d0d]"}`} />
        <span>{eyebrow}</span>
      </div>
      <h2
        className={`mt-6 text-4xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.03em] leading-[1.02] ${heading}`}
        style={{ fontFamily: '"Space Grotesk", sans-serif' }}
      >
        {title}
      </h2>
    </div>
  );
}
