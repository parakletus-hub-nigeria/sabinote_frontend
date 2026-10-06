"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ReleaseBadge } from "@/components/release";

/* ── Brand logo image (reused in nav + footer) ───────────────────── */
const LOGO_URL =
  "https://res.cloudinary.com/drh4ma3hj/image/upload/v1779473509/SabiNote_Purple_SVG_tlzlqm.svg";
function BrandMark({ height = 32 }: { height?: number }) {
  return (
    <img
      src={LOGO_URL}
      alt="SabiNote"
      style={{ height, width: "auto", objectFit: "contain", display: "block" }}
    />
  );
}

/* ── Arrow icon ─────────────────────────────────────────────────── */
function ArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3 7h8m0 0L8 4m3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Section eyebrow ────────────────────────────────────────────────
   A running index + rule line replaces the pill-badge kicker as the
   section-to-section grammar. Ties into the 01/02/03 step numbering
   already used further down the page, so it reads as one system
   rather than a repeated badge component. ── */
function SectionEyebrow({
  index,
  dark = false,
}: {
  index: string;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 mb-5" aria-hidden="true">
      <span
        className="font-mono text-xs tracking-wide"
        style={{ color: dark ? "rgba(255,255,255,0.3)" : "#C7C2D6" }}
      >
        {index}
      </span>
      <span
        className="h-px flex-1 max-w-16"
        style={{ background: dark ? "rgba(255,255,255,0.12)" : "#E5E7EB" }}
      />
    </div>
  );
}

/* ── Hero preview card ──────────────────────────────────────────── */
function PreviewCard() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "white",
        border: "1px solid #E5E7EB",
        boxShadow:
          "0 24px 80px rgba(15,10,30,0.14), 0 4px 16px rgba(15,10,30,0.06)",
        maxWidth: 420,
      }}
    >
      {/* Chrome bar */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ background: "#F9FAFB", borderColor: "#E5E7EB" }}
      >
        <span className="flex gap-1.5">
          {["#FF5F57", "#FFBD2E", "#28C840"].map((c, i) => (
            <span
              key={i}
              className="w-3 h-3 rounded-full"
              style={{ background: c }}
            />
          ))}
        </span>
        <span
          className="flex-1 text-center text-xs font-mono truncate px-2 py-0.5 rounded"
          style={{ background: "#F3F4F6", color: "#9CA3AF" }}
        >
          sabinote.app/notes/multiplication-jss1
        </span>
        <span
          className="flex items-center gap-1 text-xs"
          style={{ color: "#10B981" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Saved just now
        </span>
      </div>

      {/* Card body */}
      <div className="p-5">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[
            { label: "Mathematics", bg: "#EDE9FE", color: "#5B21B6" },
            { label: "JSS 1", bg: "#F3F4F6", color: "#374151" },
            { label: "Term 1 · Wk 3", bg: "#F3F4F6", color: "#374151" },
            { label: "Lagos State", bg: "#CCFBF1", color: "#0D9488" },
          ].map((t, i) => (
            <span
              key={i}
              className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{ background: t.bg, color: t.color }}
            >
              {t.label}
            </span>
          ))}
        </div>

        <h3
          className="font-display font-bold text-gray-900 text-lg mb-4 leading-snug"
          style={{ letterSpacing: "-0.01em" }}
        >
          Whole Numbers — Multiplication &amp; Division
        </h3>

        {/* Behavioural objectives */}
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Behavioural objectives
          </div>
          {[92, 78, 85].map((w, i) => (
            <div
              key={i}
              className="h-2.5 rounded-full mb-1.5"
              style={{
                background: "#D1D5DB",
                ...({ "--w": `${w}%` } as React.CSSProperties),
                animation: `typeLine 1.2s ${i * 0.5}s both ease-out`,
              }}
            />
          ))}
        </div>

        {/* Worked example */}
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Worked example
          </div>
          <pre
            className="text-xs leading-relaxed rounded-lg p-3"
            style={{
              background: "#F9FAFB",
              fontFamily: "JetBrains Mono, monospace",
              color: "#374151",
              border: "1px solid #E5E7EB",
            }}
          >
            {`  4,326
×    47
──────
  30,282
+173,040
──────
  203,322  `}
            <span style={{ color: "#10B981" }}>✓</span>
          </pre>
        </div>

        {/* Common misconceptions */}
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Common misconceptions
          </div>
          {[95, 62].map((w, i) => (
            <div
              key={i}
              className="h-2.5 rounded-full mb-1.5 bg-gray-100"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span
            className="text-xs font-medium flex items-center gap-1"
            style={{ color: "#641BC4" }}
          >
            ⚡ Generated · <strong>20 ₽</strong>
          </span>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer"
            style={{ background: "#F5F3FF", color: "#641BC4" }}
          >
            Export ↓
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Float chip ─────────────────────────────────────────────────── */
function FloatChip({
  icon,
  iconBg,
  iconColor,
  title,
  sub,
  style,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  sub: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="absolute flex items-center gap-2.5 bg-white rounded-2xl px-3 py-2.5 shadow-lg"
      style={{ border: "1px solid #E5E7EB", ...style }}
    >
      <span
        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </span>
      <div>
        <div className="text-xs font-semibold text-gray-900 whitespace-nowrap">
          {title}
        </div>
        <div className="text-xs text-gray-400 whitespace-nowrap">{sub}</div>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────── */
export default function LandingPage() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onScroll() {
      if (navRef.current) {
        navRef.current.classList.toggle("nav-scrolled", window.scrollY > 60);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const useCases = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 6h16M4 12h16M4 18h10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
      iconBg: "#EDE9FE",
      iconColor: "#5B21B6",
      title: "Weekly lesson plans",
      desc: "Pick your state, subject, class and week — SabiNote pulls the exact NERDC scheme of work and drafts a structured plan with objectives, materials and assessment.",
      meta: "8 ₽",
      metaSub: "per plan",
      large: true,
      dark: false,
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      ),
      iconBg: "rgba(252,211,77,.15)",
      iconColor: "#FCD34D",
      title: "Full lesson notes with worked examples",
      desc: "Promote a plan into a complete teacher-ready note — narrative introduction, sub-topics, worked maths, common misconceptions and assignment.",
      meta: "20 ₽",
      metaSub: "plan + note",
      large: true,
      dark: true,
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="m9 12 2 2 4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
      iconBg: "#CCFBF1",
      iconColor: "#0D9488",
      title: "State-aware curriculum",
      desc: "Lagos teaches it differently from Kano — and SabiNote knows.",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 4h16v12H4z M4 16l4-4 3 3 4-5 5 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      ),
      iconBg: "#FEF3C7",
      iconColor: "#B45309",
      title: "Refine on canvas",
      desc: "Edit any AI draft on a focused, auto-saving rich-text canvas.",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      iconBg: "#DBEAFE",
      iconColor: "#1D4ED8",
      title: "Export PDF or DOCX",
      desc: "One click to share with your HOD or print for class.",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 5h16v3H4z M4 11h16v8H4z M8 8v3M16 8v3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      ),
      iconBg: "#FCE7F3",
      iconColor: "#9D174D",
      title: "Note library",
      desc: "Every generated note saved, searchable and re-exportable.",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 7h18v10H3z M3 11h18M7 15h2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      ),
      iconBg: "#D1FAE5",
      iconColor: "#047857",
      title: "$Parats wallet",
      desc: "Pay only for what you generate. No subscriptions.",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 19V5l8 4 8-4v14l-8-4-8 4Z M12 9v10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      ),
      iconBg: "#E0E7FF",
      iconColor: "#3730A3",
      title: "Reference textbook match",
      desc: "Auto-suggests the standard textbook for each topic.",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
      iconBg: "#FFE4E6",
      iconColor: "#9F1239",
      title: "Difficulty tiers",
      desc: "Basic, Standard or Advanced — match your class.",
    },
  ];

  const testimonials = [
    {
      avatar: "A",
      avatarBg: "#A78BFA",
      name: "Mrs. Adaeze Nwosu",
      role: "Chemistry · Ikeja, Lagos",
      quote:
        "My Friday evenings used to disappear into lesson planning. SabiNote drafts my whole week's notes before I finish my tea — and they actually match the Lagos scheme.",
    },
    {
      avatar: "B",
      avatarBg: "#F97316",
      name: "Mr. Babatunde Olawale",
      role: "Mathematics · Ibadan, Oyo",
      quote:
        "The worked examples are pure gold. I used to type long-multiplication out by hand. Now I tweak SabiNote's draft, export to PDF, print — done.",
    },
    {
      avatar: "F",
      avatarBg: "#0D9488",
      name: "Mrs. Fatima Al-Hassan",
      role: "English · Kano",
      quote:
        "What sold me was that it knew the Kano-state textbook. No re-aligning, no second-guessing. My HOD has stopped sending notes back for revision.",
    },
  ];

  return (
    <div
      className="min-h-screen bg-white overflow-x-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ── NAV ───────────────────────────────────────────── */}
      <header
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
        style={{ background: "transparent" }}
      >
        <div className="max-w-6xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Brand */}
          <Link href="/" className="flex flex-col items gap-1.5 shrink-0">
            <BrandMark height={30} />
            <span
              className="hidden sm:block"
              style={{
                fontSize: "9px",
                color: "#9CA3AF",
                letterSpacing: "0.04em",
                lineHeight: 1,
                marginTop: "1px",
              }}
            >
              by Parakletus
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {[
              ["#use-cases", "Use cases"],
              ["#how", "How it works"],
              ["#features", "Why SabiNote"],
              ["#pricing", "Pricing"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all hidden sm:block"
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-lg transition-all hover:opacity-90"
              style={{ background: "#641BC4" }}
            >
              Start free <ArrowRight />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        {/* Background elements */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(100,27,196,0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="absolute top-1/4 left-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)",
            filter: "blur(40px)",
            transform: "translate(-30%, -50%)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(13,148,136,0.1) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-5 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — text */}
            <div>
              {/* Pill */}
              <div
                className="inline-flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full mb-6"
                style={{
                  background: "#F5F3FF",
                  border: "1px solid #EDE9FE",
                  color: "#641BC4",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "#641BC4" }}
                />
                Built for the Sovereign Scholar
              </div>

              {/* H1 */}
              <h1
                className="font-display font-extrabold text-gray-900 mb-5 leading-none"
                style={{
                  fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
                  letterSpacing: "-0.03em",
                }}
              >
                NERDC&#8209;compliant
                <br />
                lesson notes,
                <br />
                <span style={{ color: "oklch(40% 0.22 290)" }}>generated in seconds.</span>
              </h1>

              <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-lg">
                Eliminate hours of manual planning. SabiNote pulls your state's
                official scheme of work and writes a complete, classroom-ready
                lesson note — yours to refine, export, and teach from today.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href="/auth/register"
                  className="flex items-center gap-2 text-white font-semibold px-5 py-3 rounded-xl transition-all hover:opacity-90"
                  style={{
                    background: "#641BC4",
                    boxShadow: "0 8px 24px rgba(100,27,196,0.3)",
                  }}
                >
                  Start generating for free
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8h10m0 0L9 4m4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
                <Link
                  href="#how"
                  className="flex items-center gap-2 font-semibold px-5 py-3 rounded-xl transition-all hover:bg-gray-50"
                  style={{ border: "1.5px solid #E5E7EB", color: "#374151" }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M4 3v8l7-4-7-4Z" fill="currentColor" />
                  </svg>
                  Watch 2-min demo
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[
                    ["A", "#A78BFA"],
                    ["B", "#F97316"],
                    ["C", "#0D9488"],
                    ["F", "#641BC4"],
                    ["+", "#FBBF24"],
                  ].map(([l, bg], i) => (
                    <span
                      key={i}
                      className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-sm font-bold"
                      style={{
                        background: bg,
                        color: l === "+" ? "#0F0A1E" : "white",
                      }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    4,000+ Nigerian educators
                  </div>
                  <div className="text-xs text-yellow-500">
                    <span aria-hidden="true">★★★★★</span>{" "}
                    <span className="text-gray-400">4.9 · 200+ reviews</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — preview card */}
            <div className="relative hidden lg:block">
              <div className="animate-float">
                <PreviewCard />
              </div>

              {/* Floating chips */}
              <FloatChip
                icon="✦"
                iconBg="#EDE9FE"
                iconColor="#641BC4"
                title="State curriculum"
                sub="Auto-fetched from NERDC"
                style={{ top: "10%", left: "-14%" }}
              />
              <FloatChip
                icon="✓"
                iconBg="#CCFBF1"
                iconColor="#0D9488"
                title="Plan ready in 8s"
                sub="Then refine on canvas"
                style={{ bottom: "28%", left: "-18%" }}
              />
              <FloatChip
                icon="↓"
                iconBg="#FEF3C7"
                iconColor="#B45309"
                title="PDF · DOCX"
                sub="One-click export"
                style={{ bottom: "8%", right: "-6%" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST MARQUEE ─────────────────────────────────── */}
      <section
        className="py-5 border-y border-gray-100 overflow-hidden"
        style={{ background: "#FAFAFA" }}
      >
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <p className="text-xs font-medium text-gray-400 text-center mb-3 uppercase tracking-widest">
            Aligned with curricula across
          </p>
          <p className="sr-only">
            Lagos, Oyo, Kano, Rivers, Kaduna, Enugu, FCT Abuja, Anambra, Ogun,
            Cross River, Edo and Plateau States.
          </p>
        </div>
        <div className="overflow-hidden" aria-hidden="true">
          <div
            className="flex gap-6 items-center animate-marquee whitespace-nowrap"
            style={{ width: "max-content" }}
          >
            {[
              "Lagos State",
              "·",
              "Oyo State",
              "·",
              "Kano State",
              "·",
              "Rivers State",
              "·",
              "Kaduna State",
              "·",
              "Enugu State",
              "·",
              "FCT Abuja",
              "·",
              "Anambra State",
              "·",
              "Ogun State",
              "·",
              "Cross River",
              "·",
              "Edo State",
              "·",
              "Plateau State",
              "·",
              "Lagos State",
              "·",
              "Oyo State",
              "·",
              "Kano State",
              "·",
              "Rivers State",
              "·",
              "Kaduna State",
              "·",
              "Enugu State",
              "·",
              "FCT Abuja",
              "·",
              "Anambra State",
              "·",
              "Ogun State",
              "·",
              "Cross River",
              "·",
              "Edo State",
              "·",
              "Plateau State",
              "·",
            ].map((s, i) => (
              <span
                key={i}
                className={`text-sm shrink-0 ${s === "·" ? "text-gray-200" : "font-medium text-gray-400"}`}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ─────────────────────────────────────── */}
      <section className="py-20 lg:py-28 px-5 lg:px-8" id="use-cases">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-lg mb-14">
            <SectionEyebrow index="02" />
            <h2
              className="font-display font-bold text-gray-900 mb-4"
              style={{
                fontSize: "clamp(2rem,4vw,2.8rem)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              One tool. Every
              <br />
              lesson moment.
            </h2>
            <p className="text-gray-500 leading-relaxed">
              SabiNote handles the heavy lifting across the full teaching
              workflow — from weekly planning to printable hand-outs.
            </p>
          </div>

          {/* Large cards row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {useCases.slice(0, 2).map((uc, i) => (
              <div
                key={i}
                className="rounded-2xl p-7 transition-transform duration-200 hover-lift"
                style={
                  uc.dark
                    ? {
                        background: "#0A0512",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }
                    : { background: "white", border: "1px solid #E5E7EB" }
                }
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: uc.iconBg, color: uc.iconColor }}
                  aria-hidden="true"
                >
                  {uc.icon}
                </div>
                <h3
                  className={`font-display font-semibold text-xl mb-3 ${uc.dark ? "text-white" : "text-gray-900"}`}
                >
                  {uc.title}
                </h3>
                <p
                  className={`text-sm leading-relaxed mb-5 ${uc.dark ? "text-white/60" : "text-gray-500"}`}
                >
                  {uc.desc}
                </p>
                {uc.meta && (
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono font-bold text-base"
                      style={{ color: uc.dark ? "#FCD34D" : "#641BC4" }}
                    >
                      {uc.meta}
                    </span>
                    <span
                      className={`text-xs ${uc.dark ? "text-white/40" : "text-gray-400"}`}
                    >
                      {uc.metaSub}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Feature ledger — numbered rows continue the section's index
              system instead of repeating the icon-square card template. */}
          <div className="border-t" style={{ borderColor: "#E5E7EB" }}>
            {useCases.slice(2).map((uc, i) => (
              <div
                key={i}
                className="grid sm:grid-cols-[3rem_1fr] md:grid-cols-[3rem_16rem_1fr] gap-x-6 gap-y-1.5 py-5 border-b sm:items-baseline"
                style={{ borderColor: "#E5E7EB" }}
              >
                <span
                  className="font-mono text-xs"
                  style={{ color: "#C7C2D6" }}
                >
                  {String(i + 3).padStart(2, "0")}
                </span>
                <h3 className="font-display font-semibold text-gray-900">
                  {uc.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500 max-w-md">
                  {uc.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section
        className="py-20 lg:py-28 px-5 lg:px-8"
        style={{ background: "#FAFAFA" }}
        id="how"
      >
        <div className="max-w-6xl mx-auto">
          <div className="max-w-lg mx-auto text-center mb-14">
            <div className="flex justify-center">
              <SectionEyebrow index="03" />
            </div>
            <h2
              className="font-display font-bold text-gray-900"
              style={{
                fontSize: "clamp(2rem,4vw,2.8rem)",
                letterSpacing: "-0.02em",
              }}
            >
              From curriculum
              <br />
              to classroom in 3 steps.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 01 */}
            <div
              className="bg-white rounded-2xl p-7"
              style={{ border: "1px solid #E5E7EB" }}
            >
              <div
                className="font-mono font-bold text-4xl mb-3"
                style={{ color: "#EDE9FE", WebkitTextStroke: "2px #C4B5FD" }}
              >
                01
              </div>
              <h3 className="font-display font-bold text-gray-900 text-lg mb-2">
                Configure your lesson
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                Pick state, subject, class, term and week. SabiNote pulls the
                official scheme of work automatically — no copy-pasting from
                PDFs.
              </p>
              {/* Visual */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid #E5E7EB" }}
              >
                {[
                  ["Subject", "Mathematics"],
                  ["Class", "JSS 1"],
                  ["Term · Week", "Term 1 · Week 3"],
                ].map(([label, val], i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50"
                  >
                    <span className="text-xs text-gray-400">{label}</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {val}
                    </span>
                  </div>
                ))}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ background: "#F0FDF4" }}
                >
                  <span
                    className="text-xs font-medium"
                    style={{ color: "#10B981" }}
                  >
                    ✓ Lagos State
                  </span>
                  <span className="text-xs text-gray-400">
                    curriculum matched
                  </span>
                </div>
              </div>
            </div>

            {/* Step 02 */}
            <div
              className="bg-white rounded-2xl p-7"
              style={{ border: "1px solid #E5E7EB" }}
            >
              <div
                className="font-mono font-bold text-4xl mb-3"
                style={{ color: "#EDE9FE", WebkitTextStroke: "2px #C4B5FD" }}
              >
                02
              </div>
              <h3 className="font-display font-bold text-gray-900 text-lg mb-2">
                AI drafts your plan
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                Our RAG pipeline grounds every output in your state's verified
                scheme of work. You get a structured plan in under 10 seconds.
              </p>
              {/* Visual */}
              <div className="rounded-xl p-4" style={{ background: "#0A0512" }}>
                <div
                  className="w-8 h-8 rounded-full mb-3 animate-pulse"
                  style={{
                    background: "radial-gradient(circle, #7C3AED, #641BC4)",
                  }}
                />
                <p
                  className="text-xs mb-3"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Fetching Week 3 scheme of work...
                </p>
                <div
                  className="h-1.5 rounded-full mb-3"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg,#7C3AED,#14B8A6)",
                      animation: "genFill 2.5s ease-out forwards",
                    }}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    ["Curriculum", "done"],
                    ["Matching", "done"],
                    ["Structuring", "active"],
                    ["Quality check", ""],
                  ].map(([s, state], i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background:
                          state === "done"
                            ? "rgba(16,185,129,0.2)"
                            : state === "active"
                              ? "rgba(100,27,196,0.3)"
                              : "rgba(255,255,255,0.08)",
                        color:
                          state === "done"
                            ? "#10B981"
                            : state === "active"
                              ? "#A78BFA"
                              : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 03 */}
            <div
              className="bg-white rounded-2xl p-7"
              style={{ border: "1px solid #E5E7EB" }}
            >
              <div
                className="font-mono font-bold text-4xl mb-3"
                style={{ color: "#EDE9FE", WebkitTextStroke: "2px #C4B5FD" }}
              >
                03
              </div>
              <h3 className="font-display font-bold text-gray-900 text-lg mb-2">
                Refine &amp; export
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                Edit on the auto-saving canvas, generate the full note when
                ready, then export as PDF or DOCX. Every keystroke is preserved.
              </p>
              {/* Visual */}
              <div className="space-y-2">
                {[
                  {
                    type: "PDF",
                    typeBg: "#FEE2E2",
                    typeColor: "#B91C1C",
                    name: "Multiplication_JSS1.pdf",
                    meta: "Ready · 4 pages",
                  },
                  {
                    type: "DOCX",
                    typeBg: "#DBEAFE",
                    typeColor: "#1E40AF",
                    name: "Multiplication_JSS1.docx",
                    meta: "Editable · Word",
                  },
                ].map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: "#FAFAFA",
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    <span
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: f.typeBg, color: f.typeColor }}
                    >
                      {f.type}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        {f.name}
                      </p>
                      <p className="text-xs text-gray-400">{f.meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES (DARK) ───────────────────────────────── */}
      <section
        className="py-20 lg:py-28 px-5 lg:px-8"
        style={{ background: "#0A0512" }}
        id="features"
      >
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-16">
            <SectionEyebrow index="04" dark />
            <h2
              className="font-display font-bold text-white"
              style={{
                fontSize: "clamp(2rem,4vw,2.8rem)",
                letterSpacing: "-0.02em",
              }}
            >
              Intelligence grounded
              <br />
              in your state's curriculum.
            </h2>
          </div>

          {/* Feature 1 — RAG pipeline */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="font-display font-bold text-white text-2xl mb-4">
                Built on your state's curriculum
              </h3>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                SabiNote doesn't guess. It matches every lesson to the exact
                week's scheme of work for your state — Lagos, Ogun, Kano, or
                wherever you teach — so every output is curriculum-aligned and
                classroom-ready.
              </p>
              <ul className="space-y-2.5">
                {[
                  "36 state curricula indexed and updated",
                  "Citations link to source documents",
                  "Difficulty tiers: Basic / Standard / Advanced",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 text-sm"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "#14B8A6" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* RAG diagram */}
            <div
              className="rounded-2xl p-8"
              style={{
                background: "#140D2B",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: "Your state",
                    value: "Lagos",
                    color: "#A78BFA",
                    bg: "rgba(167,139,250,0.15)",
                  },
                  {
                    label: "Curriculum",
                    value: "Matched ✓",
                    color: "#14B8A6",
                    bg: "rgba(20,184,166,0.15)",
                  },
                  {
                    label: "Generating",
                    value: "In progress…",
                    color: "#FBBF24",
                    bg: "rgba(251,191,36,0.15)",
                  },
                  {
                    label: "Lesson note",
                    value: "Ready",
                    color: "#10B981",
                    bg: "rgba(16,185,129,0.2)",
                    accent: true,
                  },
                ].map((node, i) => (
                  <div key={i}>
                    <div
                      className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{
                        background: node.bg,
                        border: `1px solid ${node.color}30`,
                      }}
                    >
                      <span
                        className="text-xs font-medium"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        {node.label}
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: node.color }}
                      >
                        {node.value}
                      </span>
                    </div>
                    {i < 3 && (
                      <div className="flex justify-center my-1">
                        <div
                          className="w-0.5 h-3 rounded-full"
                          style={{
                            background: "rgba(255,255,255,0.1)",
                            animation: "flowPulse 2s ease-in-out infinite",
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature 2 — Canvas */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Canvas mock (left on desktop) */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "#140D2B",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* Chrome */}
              <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              >
                <span className="flex gap-1.5">
                  {["#FF5F57", "#FFBD2E", "#28C840"].map((c, i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: c }}
                    />
                  ))}
                </span>
                <span
                  className="flex items-center gap-1 ml-auto text-xs"
                  style={{ color: "#10B981" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />{" "}
                  Saved · auto
                </span>
              </div>
              {/* Body */}
              <div className="p-5 space-y-3">
                {["## Behavioural objectives", "## Development"].map((h, i) => (
                  <div key={i}>
                    <div
                      className="text-xs font-mono font-semibold mb-2"
                      style={{ color: "#A78BFA" }}
                    >
                      {h}
                    </div>
                    {(i === 0 ? [90, 74, 82] : [95, 60]).map((w, j) => (
                      <div
                        key={j}
                        className="h-2.5 rounded-full mb-1.5"
                        style={{
                          width: `${w}%`,
                          background: "rgba(255,255,255,0.08)",
                        }}
                      />
                    ))}
                    {i === 1 && (
                      <div
                        className="relative h-2.5 rounded-full"
                        style={{
                          width: "78%",
                          background: "rgba(100,27,196,0.3)",
                          border: "1px solid rgba(100,27,196,0.5)",
                        }}
                      >
                        <span
                          className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-sm"
                          style={{
                            background: "#641BC4",
                            animation: "caret-blink 1s step-end infinite",
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                {/* Floating toolbar */}
                <div
                  className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: "#0F0A1E",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {["B", "I", "U", "H₂", "•"].map((t, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded cursor-pointer hover:bg-white/10 transition-colors"
                      style={{ fontStyle: t === "I" ? "italic" : undefined }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-display font-bold text-white text-2xl mb-4">
                Human-in-the-loop canvas
              </h3>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                You stay in control. Review and edit the AI-drafted lesson plan
                before committing to the full note. Our rich-text canvas
                auto-saves every keystroke, so nothing is ever lost.
              </p>
              <ul className="space-y-2.5">
                {[
                  "Auto-save on every keystroke",
                  "Floating selection toolbar",
                  "Two-phase: plan first, then full note",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 text-sm"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "#F97316" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────── */}
      <section className="py-20 lg:py-28 px-5 lg:px-8 bg-white" id="pricing">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-lg mx-auto text-center mb-12">
            <div className="flex justify-center">
              <SectionEyebrow index="05" />
            </div>
            <h2
              className="font-display font-bold text-gray-900 mb-3"
              style={{
                fontSize: "clamp(2rem,4vw,2.8rem)",
                letterSpacing: "-0.02em",
              }}
            >
              Pay only for what
              <br />
              you generate.
            </h2>
            <p className="text-gray-500">
              No subscriptions. No hidden fees. Just $Parats — top up once,
              generate when you need.
            </p>
          </div>

          {/* Parats explainer bar */}
          <div
            className="flex items-center justify-center gap-8 flex-wrap rounded-2xl px-8 py-5 mb-10 max-w-2xl mx-auto"
            style={{ background: "#F5F3FF", border: "1px solid #EDE9FE" }}
          >
            {[
              ["8 ₽", "Lesson plan"],
              ["12 ₽", "Lesson note"],
              ["20 ₽", "Full package"],
            ].map(([num, label], i) => (
              <div key={i} className="flex items-center gap-3">
                {i > 0 && (
                  <span
                    className="w-px h-8 bg-brand-200"
                    style={{ background: "#C4B5FD" }}
                  />
                )}
                <span
                  className="font-display font-bold text-lg"
                  style={{ color: "#641BC4" }}
                >
                  {num}
                </span>
                <span className="text-sm text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              {
                name: "Starter",
                sub: "Try it out",
                parats: "50 ₽",
                price: "₦250",
                features: [
                  "≈ 6 lesson plans",
                  "≈ 2 full packages",
                  "All subjects & classes",
                  "PDF + DOCX export",
                ],
                featured: false,
              },
              {
                name: "Teacher",
                sub: "Weekly use",
                parats: "100 ₽",
                price: "₦500",
                features: [
                  "≈ 12 lesson plans",
                  "≈ 5 full packages",
                  "Priority generation",
                  "Note library & search",
                  "Email support",
                ],
                featured: true,
              },
              {
                name: "School",
                sub: "Departments",
                parats: "500 ₽",
                price: "₦2,000",
                features: [
                  "≈ 25 full packages",
                  "Best value per ₽",
                  "Bulk export (.zip)",
                  "Shared school library*",
                  "Dedicated support",
                ],
                featured: false,
              },
            ].map((pkg, i) => (
              <div
                key={i}
                className="rounded-2xl p-7 relative transition-transform duration-200 hover-lift"
                style={
                  pkg.featured
                    ? {
                        background: "#641BC4",
                        border: "2px solid #641BC4",
                        boxShadow: "0 16px 48px rgba(100,27,196,0.35)",
                      }
                    : { background: "white", border: "1px solid #E5E7EB" }
                }
              >
                {pkg.featured && (
                  <span
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap"
                    style={{ background: "#F97316", color: "white" }}
                  >
                    Most popular
                  </span>
                )}
                <div className="mb-5">
                  <div
                    className={`font-display font-bold text-lg ${pkg.featured ? "text-white" : "text-gray-900"}`}
                  >
                    {pkg.name}
                  </div>
                  <div
                    className={`text-sm ${pkg.featured ? "text-white/60" : "text-gray-400"}`}
                  >
                    {pkg.sub}
                  </div>
                </div>
                <div className="mb-6">
                  <span
                    className={`font-display font-bold text-3xl ${pkg.featured ? "text-white" : "text-gray-900"}`}
                  >
                    {pkg.parats}
                  </span>
                  <span
                    className={`ml-2 text-sm font-medium ${pkg.featured ? "text-white/70" : "text-gray-500"}`}
                  >
                    {pkg.price}
                  </span>
                </div>
                <ul className="space-y-2 mb-7">
                  {pkg.features.map((f, j) => (
                    <li
                      key={j}
                      className={`flex items-center gap-2 text-sm ${pkg.featured ? "text-white/80" : "text-gray-600"}`}
                    >
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: pkg.featured
                            ? "rgba(255,255,255,0.2)"
                            : "#EDE9FE",
                        }}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={pkg.featured ? "white" : "#641BC4"}
                          strokeWidth="3"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className="block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all"
                  style={
                    pkg.featured
                      ? { background: "white", color: "#641BC4" }
                      : {
                          border: "1.5px solid #E5E7EB",
                          color: "#374151",
                          background: "transparent",
                        }
                  }
                >
                  Get {pkg.name}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            * Shared library coming soon. All purchases secured by Paystack.
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section
        className="py-20 lg:py-28 px-5 lg:px-8"
        style={{ background: "#FAFAFA" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="max-w-lg mx-auto text-center mb-12">
            <div className="flex justify-center">
              <SectionEyebrow index="06" />
            </div>
            <h2
              className="font-display font-bold text-gray-900"
              style={{
                fontSize: "clamp(2rem,4vw,2.8rem)",
                letterSpacing: "-0.02em",
              }}
            >
              Real teachers.
              <br />
              Real time saved.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 transition-transform duration-200 hover-lift"
                style={{ border: "1px solid #E5E7EB" }}
              >
                <div
                  className="text-yellow-400 mb-4 text-sm"
                  aria-hidden="true"
                >
                  ★★★★★
                </div>
                <span className="sr-only">5 out of 5 stars</span>
                <p className="text-gray-700 text-sm leading-relaxed italic mb-5">
                  "{t.quote}"
                </p>
                <footer className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0"
                    style={{ background: t.avatarBg }}
                  >
                    {t.avatar}
                  </span>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {t.name}
                    </div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </footer>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section
        className="relative py-24 lg:py-32 px-5 text-center overflow-hidden"
        style={{ background: "#0A0512" }}
      >
        {/* Pulsing rings */}
        {[180, 320, 480].map((size, i) => (
          <span
            key={i}
            className="absolute rounded-full border pointer-events-none"
            style={{
              top: "50%",
              left: "50%",
              width: size,
              height: size,
              borderColor: `rgba(100,27,196,${0.25 - i * 0.06})`,
              animation: `ringPing ${2.5 + i * 0.8}s ease-out ${i * 0.6}s infinite`,
            }}
          />
        ))}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(100,27,196,0.25) 0%, transparent 65%)",
          }}
        />

        <div className="relative max-w-2xl mx-auto">
          <h2
            className="font-display font-bold text-white mb-5"
            style={{
              fontSize: "clamp(2.2rem,5vw,3.5rem)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Ready to reclaim
            <br />
            your teaching time?
          </h2>
          <p
            className="text-lg mb-8"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Join thousands of Nigerian educators generating curriculum-compliant
            lesson notes in seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/register"
              className="flex items-center gap-2 text-white font-semibold px-7 py-4 rounded-xl transition-all hover:opacity-90 text-base"
              style={{
                background: "#641BC4",
                boxShadow: "0 8px 32px rgba(100,27,196,0.4)",
              }}
            >
              Start free — no card needed
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10m0 0L9 4m4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="#how"
              className="font-medium px-6 py-4 rounded-xl transition-all text-base"
              style={{
                border: "1.5px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              See how it works first →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer
        className="py-14 px-5 lg:px-8"
        style={{
          background: "#0A0512",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <BrandMark height={28} />
              </Link>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Made with care for Nigerian educators.
                <br />A Parakletus product.
              </p>
            </div>
            {[
              {
                title: "Product",
                links: [
                  ["#use-cases", "Use cases"],
                  ["#features", "Features"],
                  ["#pricing", "Pricing"],
                  ["#", "Changelog"],
                ],
              },
              {
                title: "Company",
                links: [
                  ["#", "About SabiNote"],
                  ["#", "About Parakletus"],
                  ["#", "Blog"],
                  ["#", "Careers"],
                  ["#", "Contact"],
                ],
              },
              {
                title: "Legal",
                links: [
                  ["#", "Privacy"],
                  ["#", "Terms"],
                  ["#", "Refund policy"],
                ],
              },
            ].map((col, i) => (
              <div key={i}>
                <div
                  className="font-semibold text-sm mb-4"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {col.title}
                </div>
                <ul className="space-y-2.5">
                  {col.links.map(([href, label], j) => (
                    <li key={j}>
                      <a
                        href={href}
                        className="text-sm transition-colors hover:text-white/70"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <span
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                © 2026 Parakletus Technologies. All rights reserved.
              </span>
              <ReleaseBadge variant="dark" />
            </div>
            <div className="flex gap-4">
              {/* X/Twitter */}
              <a
                href="#"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2H21l-6.52 7.45L22 22h-6.84l-4.76-6.23L4.8 22H2l7.05-8.05L1.5 2h7l4.31 5.7L18.244 2Zm-1.2 18h1.86L7.06 4H5.1l11.94 16Z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="#"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.22 8h4.56v14H.22V8Zm7.86 0h4.37v1.92h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.47 3.04 5.47 7v7.44h-4.55V15.5c0-1.7-.03-3.88-2.36-3.88-2.37 0-2.73 1.85-2.73 3.76V22H8.08V8Z" />
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="#"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.86 5.86 0 0 0-2.13 1.38A5.86 5.86 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.73 1.46 1.38 2.13a5.87 5.87 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.87 5.87 0 0 0 2.13-1.38 5.87 5.87 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.86 5.86 0 0 0-1.38-2.13A5.86 5.86 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
