"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import SocialCards, { type CardItem } from "@/components/ui/card-fan-carousel";

// ── XSPEED Logo ───────────────────────────────────────────────────────────────
function XSpeedLogo({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const cfg = {
    sm: { x: "text-xl",    s: "text-lg",    sub: "text-[7px]",  lines: 16 },
    md: { x: "text-2xl",   s: "text-xl",    sub: "text-[8px]",  lines: 20 },
    lg: { x: "text-5xl",   s: "text-4xl",   sub: "text-[10px]", lines: 32 },
    xl: { x: "text-8xl sm:text-[10rem]", s: "text-7xl sm:text-[8.5rem]", sub: "text-xs", lines: 48 },
  }[size];

  return (
    <div className="flex flex-col items-start leading-none select-none">
      <div className="flex items-end gap-0.5 relative">
        {/* Speed lines */}
        <svg
          width={cfg.lines} height={cfg.lines}
          viewBox="0 0 24 24"
          className="flex-shrink-0 self-center mr-0.5 opacity-80"
        >
          <line x1="2"  y1="5"  x2="22" y2="5"  stroke="#dc2626" strokeWidth="3" strokeLinecap="round"/>
          <line x1="2"  y1="12" x2="18" y2="12" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="2"  y1="19" x2="14" y2="19" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span className={`font-black italic text-red-600 ${cfg.x} tracking-tight`}>X</span>
        <span className={`font-black text-white ${cfg.s} tracking-widest`}>SPEED</span>
      </div>
      <div className="flex items-center gap-2 mt-0.5 pl-[calc(0.375rem+4px)]">
        <div className="h-[2px] w-6 bg-red-600 rounded-full" />
        <span className={`text-gray-500 uppercase tracking-[0.22em] font-semibold ${cfg.sub}`}>
          Motorsports
        </span>
      </div>
    </div>
  );
}

// ── F1 Side-View Silhouette SVG ───────────────────────────────────────────────
function F1SideSVG({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 240 80" className={className} fill="none" style={style}>
      {/* body */}
      <path d="M20 55 Q30 30 70 28 L140 26 Q175 24 200 38 L220 55 Z" fill="currentColor" opacity="0.85"/>
      {/* cockpit bubble */}
      <ellipse cx="115" cy="28" rx="22" ry="10" fill="currentColor" opacity="0.6"/>
      {/* front wing */}
      <path d="M200 55 L230 55 L228 60 L198 60 Z" fill="currentColor" opacity="0.75"/>
      {/* rear wing */}
      <path d="M12 28 L26 28 L28 38 L10 38 Z" fill="currentColor" opacity="0.75"/>
      <rect x="8" y="24" width="18" height="4" rx="1" fill="currentColor" opacity="0.8"/>
      {/* wheels */}
      <ellipse cx="55"  cy="58" rx="16" ry="16" fill="currentColor" opacity="0.9"/>
      <ellipse cx="55"  cy="58" rx="8"  ry="8"  fill="black" opacity="0.5"/>
      <ellipse cx="195" cy="58" rx="16" ry="16" fill="currentColor" opacity="0.9"/>
      <ellipse cx="195" cy="58" rx="8"  ry="8"  fill="black" opacity="0.5"/>
    </svg>
  );
}

// ── Animated F1 Cars (background racing silhouettes) ─────────────────────────
function F1RacingBg() {
  const cars = [
    { y: "72%", dur: 6,   delay: 0,   color: "#dc2626", opacity: 0.25, scale: 1.1 },
    { y: "80%", dur: 9,   delay: 2.5, color: "#991b1b", opacity: 0.15, scale: 0.8 },
    { y: "76%", dur: 7.5, delay: 5,   color: "#c2410c", opacity: 0.18, scale: 0.95 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {cars.map((car, i) => (
        <motion.div
          key={i}
          initial={{ x: "-20vw" }}
          animate={{ x: "120vw" }}
          transition={{
            duration: car.dur,
            delay: car.delay,
            repeat: Infinity,
            repeatDelay: car.dur * 0.6,
            ease: "linear",
          }}
          className="absolute"
          style={{ top: car.y, transform: `scaleY(${car.scale})` }}
        >
          <F1SideSVG
            className="w-32 sm:w-44"
            style={{ color: car.color, opacity: car.opacity }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ── Video Background ──────────────────────────────────────────────────────────
function VideoBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Try to load the race video — fails silently if file absent */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-[0.18]"
        onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = "none"; }}
      >
        <source src="/videos/hero-race.mp4" type="video/mp4" />
      </video>

      {/* Static race photo fallback + gradient */}
      <Image
        src="/images/racing/f1-race-7.jpg"
        alt=""
        fill
        priority
        quality={60}
        className="object-cover object-center opacity-[0.12]"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/88 via-black/55 to-black/95" />

      {/* Grid texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-[0.06]" />

      {/* Red ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-red-700/10 rounded-full blur-3xl" />

      {/* Animated F1 silhouettes */}
      <F1RacingBg />
    </div>
  );
}

// ── F1 Car (front-facing) for intro ──────────────────────────────────────────
function F1CarFrontSVG() {
  return (
    <svg viewBox="0 0 320 270" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <filter id="carGlow"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="shadowGlow"><feGaussianBlur stdDeviation="10"/></filter>
      </defs>
      <ellipse cx="160" cy="262" rx="145" ry="9" fill="#dc2626" opacity="0.5" filter="url(#shadowGlow)"/>
      <rect x="6" y="20" width="308" height="22" rx="5" fill="#dc2626"/>
      <rect x="22" y="38" width="276" height="9" rx="2" fill="#991b1b"/>
      <rect x="6" y="16" width="14" height="60" rx="3" fill="#b91c1c"/>
      <rect x="300" y="16" width="14" height="60" rx="3" fill="#b91c1c"/>
      <rect x="50" y="24" width="220" height="4" rx="1" fill="#f87171" opacity="0.5"/>
      <path d="M96,62 L224,62 L236,160 L84,160 Z" fill="#dc2626"/>
      <path d="M130,62 L175,62 L180,160 L148,160 Z" fill="#ef4444" opacity="0.35"/>
      <path d="M96,62 L84,100 L110,102 L110,62 Z" fill="#b91c1c"/>
      <path d="M224,62 L236,100 L210,102 L210,62 Z" fill="#b91c1c"/>
      <path d="M110,62 L160,30 L210,62 Z" fill="#0d0d0d"/>
      <ellipse cx="160" cy="70" rx="42" ry="15" fill="#0a0a0a"/>
      <path d="M108,65 Q160,43 212,65" fill="none" stroke="#3a3a3a" strokeWidth="13" strokeLinecap="round"/>
      <path d="M108,65 Q160,43 212,65" fill="none" stroke="#555" strokeWidth="6" strokeLinecap="round"/>
      <rect x="156" y="43" width="8" height="24" rx="3" fill="#444"/>
      <path d="M84,105 L18,115 L14,158 L84,160 Z" fill="#b91c1c"/>
      <path d="M236,105 L302,115 L306,158 L236,160 Z" fill="#b91c1c"/>
      <path d="M19,116 L58,112 L58,148 L19,150 Z" fill="#0d0d0d"/>
      <path d="M301,116 L262,112 L262,148 L301,150 Z" fill="#0d0d0d"/>
      <path d="M18,160 L302,160 L296,176 L24,176 Z" fill="#7f1d1d"/>
      <path d="M114,160 L206,160 L184,238 L136,238 Z" fill="#dc2626"/>
      <ellipse cx="160" cy="240" rx="26" ry="7" fill="#991b1b"/>
      <path d="M10,222 L310,222 L305,232 L15,232 Z" fill="#ef4444"/>
      <rect x="6" y="232" width="308" height="20" rx="6" fill="#dc2626"/>
      <rect x="6" y="214" width="11" height="38" rx="2" fill="#991b1b"/>
      <rect x="303" y="214" width="11" height="38" rx="2" fill="#991b1b"/>
      <ellipse cx="28" cy="218" rx="30" ry="36" fill="#171717"/>
      <ellipse cx="28" cy="218" rx="18" ry="22" fill="#242424"/>
      <ellipse cx="28" cy="218" rx="8"  ry="9"  fill="#2e2e2e"/>
      <path d="M8,206 A22,25 0 0,1 48,206" fill="none" stroke="#c2410c" strokeWidth="5" opacity="0.6"/>
      <ellipse cx="292" cy="218" rx="30" ry="36" fill="#171717"/>
      <ellipse cx="292" cy="218" rx="18" ry="22" fill="#242424"/>
      <ellipse cx="292" cy="218" rx="8"  ry="9"  fill="#2e2e2e"/>
      <path d="M272,206 A22,25 0 0,1 312,206" fill="none" stroke="#c2410c" strokeWidth="5" opacity="0.6"/>
      <rect x="132" y="196" width="56" height="28" rx="4" fill="#fff"/>
      <text x="160" y="215" textAnchor="middle" fontSize="18" fontWeight="900" fill="#dc2626" fontFamily="Arial, sans-serif">01</text>
    </svg>
  );
}

// ── Racing Intro Animation ────────────────────────────────────────────────────
function RacingIntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [exit, setExit] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setExit(true), 2200);
    const t2 = setTimeout(onComplete, 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!exit && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}
          className="fixed inset-0 z-[200] bg-black overflow-hidden flex items-center justify-center"
        >
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              initial={{ x: "-120vw" }} animate={{ x: "120vw" }}
              transition={{ duration: 1.6, delay: 0.25 + i * 0.12, ease: "linear" }}
              className="absolute"
              style={{
                top: `${38 + i * 8}%`, width: "220vw", height: i === 1 ? "72px" : "44px",
                backgroundImage: [
                  "linear-gradient(45deg, #fff 25%, transparent 25%)",
                  "linear-gradient(-45deg, #fff 25%, transparent 25%)",
                  "linear-gradient(45deg, transparent 75%, #fff 75%)",
                  "linear-gradient(-45deg, transparent 75%, #fff 75%)",
                ].join(", "),
                backgroundSize: "40px 40px",
                backgroundPosition: "0 0, 0 20px, 20px -20px, -20px 0px",
                backgroundColor: "#000",
                opacity: i === 1 ? 0.95 : 0.5,
              }}
            />
          ))}

          <motion.div
            initial={{ scale: 0.06, opacity: 0, y: 80 }}
            animate={{ scale: [0.06, 0.12, 0.35, 0.85, 1.6, 2.8], opacity: [0,1,1,1,1,0], y: [80,60,30,5,-30,-120] }}
            transition={{ duration: 2.0, ease: "easeIn", times: [0,0.08,0.25,0.55,0.82,1.0] }}
            className="relative z-20"
            style={{ width: "340px", height: "290px", filter: "drop-shadow(0 0 24px rgba(220,38,38,0.9))" }}
          >
            <F1CarFrontSVG />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: [0,1,1,0], scale: [0.85,1,1,0.95] }}
            transition={{ duration: 2.1, times: [0,0.2,0.75,1], delay: 0.15 }}
            className="absolute bottom-[18%] left-0 right-0 text-center z-30 pointer-events-none"
          >
            <p className="text-5xl sm:text-7xl font-black tracking-tight leading-none">
              <span className="text-white italic">X</span><span className="text-red-600">SPEED</span>
            </p>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: [0,0.8,0.8,0] }}
              transition={{ duration: 2.0, times: [0,0.25,0.75,1], delay: 0.3 }}
              className="text-gray-500 text-xs tracking-[0.45em] uppercase mt-2"
            >
              Motorsports Championship
            </motion.p>
          </motion.div>

          {[-1, 1].map(side => (
            <motion.div
              key={side}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: [0,1,1,0], opacity: [0,0.6,0.6,0] }}
              transition={{ duration: 1.8, times: [0,0.3,0.7,1], delay: 0.4 }}
              className="absolute top-1/2 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent z-10 pointer-events-none"
              style={{ width: "35%", left: side < 0 ? "5%" : "60%", transformOrigin: side < 0 ? "right" : "left" }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(target: string) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) { setT({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setT({ d: Math.floor(diff/86400000), h: Math.floor((diff%86400000)/3600000), m: Math.floor((diff%3600000)/60000), s: Math.floor((diff%60000)/1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

// ── NAVBAR ────────────────────────────────────────────────────────────────────
function Navbar({ onSectionClick }: { onSectionClick: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const navItems = ["About", "Events", "Gallery", "News", "Sponsors", "Contact"];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/90 backdrop-blur-md border-b border-zinc-800" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <button onClick={() => onSectionClick("")} className="focus:outline-none">
          <XSpeedLogo size="sm" />
        </button>

        <nav className="hidden md:flex items-center gap-5">
          {navItems.map(s => (
            <button key={s} onClick={() => onSectionClick(s.toLowerCase())}
              className="text-sm text-gray-400 hover:text-white transition-colors tracking-wide">
              {s}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Login</Link>
          <Link href="/register"
            className="bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all hover:shadow-[0_0_16px_rgba(220,38,38,0.4)]">
            Register Team
          </Link>
        </div>

        <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setOpen(v => !v)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-zinc-950 border-t border-zinc-800 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navItems.map(s => (
                <button key={s} onClick={() => { onSectionClick(s.toLowerCase()); setOpen(false); }}
                  className="block w-full text-left text-sm text-gray-400 hover:text-white py-2.5 border-b border-zinc-900 transition-colors">
                  {s}
                </button>
              ))}
              <Link href="/register"
                className="block bg-red-600 text-white text-sm font-bold px-4 py-2.5 rounded-lg text-center mt-3">
                Register Team →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ── Section card data ─────────────────────────────────────────────────────────
const SECTION_CARDS: CardItem[] = [
  { imgUrl: "/images/racing/f1-race-2.jpg",  alt: "About",    name: "About",    role: "Our Story & Mission",     number: "01" },
  { imgUrl: "/images/racing/f1-race-3.jpg",  alt: "Events",   name: "Events",   role: "Go-Kart & Formula Green", number: "02" },
  { imgUrl: "/images/racing/f1-race-4.jpg",  alt: "Gallery",  name: "Gallery",  role: "Media & Race Photos",     number: "03" },
  { imgUrl: "/images/racing/f1-race-5.jpg",  alt: "News",     name: "News",     role: "Latest Season Updates",   number: "04" },
  { imgUrl: "/images/racing/f1-race-6.jpg",  alt: "Sponsors", name: "Sponsors", role: "Partner With XSPEED",     number: "05" },
  { imgUrl: "/images/racing/f1-race-11.jpg", alt: "Contact",  name: "Contact",  role: "Get in Touch",            number: "06" },
];

// ── Hero (viewport-locked, no scroll) ────────────────────────────────────────
function HeroSection({ onCardClick }: { onCardClick: (card: CardItem, section: string) => void }) {
  const cd = useCountdown("2027-03-15T09:00:00");

  return (
    <div className="relative h-screen flex flex-col overflow-hidden">
      <VideoBackground />

      {/* Brand block */}
      <div className="relative z-10 flex-shrink-0 w-full px-4 sm:px-6 pt-20 sm:pt-24 pb-2 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/25 rounded-full px-4 py-1.5 mb-4"
        >
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-400 text-[10px] font-bold tracking-widest uppercase">Season 1 — Registrations Open</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="flex justify-center"
        >
          <XSpeedLogo size="xl" />
        </motion.div>

        {/* Countdown — centered, no extra buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.28 }}
          className="mt-5 flex flex-col items-center gap-2"
        >
          <p className="text-gray-600 text-[10px] uppercase tracking-[0.3em] font-semibold">Race Day — Mar 15, 2027</p>
          <div className="flex items-center gap-2">
            {[{ val: cd.d, label: "Days" }, { val: cd.h, label: "Hours" }, { val: cd.m, label: "Mins" }, { val: cd.s, label: "Secs" }].map(({ val, label }, i) => (
              <div key={label} className="flex items-center">
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 min-w-[52px] text-center backdrop-blur">
                  <div className="text-xl sm:text-2xl font-black text-white tabular-nums">{String(val).padStart(2, "0")}</div>
                  <div className="text-[8px] text-gray-600 uppercase tracking-widest mt-0.5">{label}</div>
                </div>
                {i < 3 && <span className="text-red-600 font-black text-lg mx-1 select-none">:</span>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Fan carousel — the primary navigation */}
      <motion.div
        initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.48 }}
        className="relative z-10 flex-1 flex flex-col items-center justify-center w-full min-h-0"
      >
        <SocialCards
          cards={SECTION_CARDS}
          layoutClass="fan-layout-hero"
          onCardClick={(card) => onCardClick(card, card.name?.toLowerCase() ?? "")}
        />
      </motion.div>

      {/* Floating Register CTA — bottom right */}
      <motion.div
        initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="absolute bottom-6 right-6 z-20"
      >
        <Link href="/register">
          <motion.span
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-3 rounded-2xl text-sm uppercase tracking-wider shadow-[0_0_28px_rgba(220,38,38,0.45)] hover:shadow-[0_0_40px_rgba(220,38,38,0.65)] transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
            </svg>
            Register Team
          </motion.span>
        </Link>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION PANEL COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

// ── About Panel ───────────────────────────────────────────────────────────────
function AboutPanel() {
  return (
    <div className="relative py-16 bg-zinc-950 min-h-full overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <Image src="/images/racing/f1-race-8.jpg" alt="" fill className="object-cover" style={{ opacity: 0.1 }} quality={40}/>
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/95 via-zinc-950/78 to-zinc-950/95"/>
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-5">
        <p className="text-red-500 text-xs font-bold uppercase tracking-[0.2em] mb-2">About XSPEED</p>
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-10">The Story Behind<br/>the Championship</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-5">
            <p className="text-gray-400 text-base leading-relaxed">
              XSPEED Motorsports Pvt. Ltd. was founded by engineers and motorsports enthusiasts who saw a gap — India's brightest engineering students had no serious competitive platform.
            </p>
            <p className="text-gray-500 leading-relaxed">
              We built a championship from scratch: real regulations, real judging, real race conditions. Every team that registers isn't just entering an event — they're proving themselves against the best student engineers in the country.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { label: "Company", value: "Pvt. Ltd." },
                { label: "Season",  value: "1 — 2027"  },
                { label: "Championships", value: "2 Events" },
                { label: "Team Slots",    value: "50+ Open"  },
              ].map(s => (
                <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-red-500 text-xs font-bold uppercase tracking-[0.2em] mb-3">Our Mission</p>
              <p className="text-white font-semibold text-base leading-snug">
                "Create India's most rigorous student motorsports ecosystem — where engineers race, learn, and lead."
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-red-500 text-xs font-bold uppercase tracking-[0.2em] mb-4">Why Trust XSPEED</p>
              <ul className="space-y-2.5">
                {[
                  "Founders with 10+ years in motorsports & engineering",
                  "Registered private limited company — full legal compliance",
                  "Safety-first event design with certified track marshals",
                  "100% transparent fee structure — no hidden costs",
                  "Industry-grade judging panel from motorsports & EV sectors",
                  "Dedicated support team for registered teams",
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-400">
                    <span className="text-green-500 flex-shrink-0 mt-0.5 font-bold">✓</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Events Panel ──────────────────────────────────────────────────────────────
const EVENTS_DATA = {
  go_kart: {
    icon: "🏎️", name: "Go-Kart Racing", tagline: "Speed. Precision. Teamwork.",
    color: "from-red-900/20 to-zinc-900",
    description: "Head-to-head circuit racing where student teams tune and race go-karts across elimination rounds to a championship final.",
    format: [
      "Qualifying laps — fastest time earns pole position",
      "Group heats — round-robin elimination rounds",
      "Semi-finals and Championship Final on race day",
      "Technical inspection mandatory before each round",
    ],
    eligibility: [
      "Enrolled in a recognized college or university",
      "Valid driving license (minimum 18 years of age)",
      "Team of 1–4 members",
      "NOC from institution required",
    ],
    dates: [
      { label: "Registration Closes",  value: "Feb 28, 2027"   },
      { label: "Technical Inspection", value: "Mar 12–13, 2027" },
      { label: "Race Day",             value: "Mar 15, 2027"   },
    ],
    faqs: [
      { q: "Do we need to bring our own kart?",  a: "Event-spec karts are provided. You may bring your own kart if it passes our technical inspection." },
      { q: "How many members per team?",          a: "1 to 4 members per team. One designated driver per race session." },
      { q: "What safety gear is required?",       a: "ECE/SNELL-rated helmet, racing suit, gloves, and neck collar. Gear available for rent at venue." },
    ],
  },
  formula_green: {
    icon: "⚡", name: "Formula Green Racing", tagline: "Innovation. Sustainability. Speed.",
    color: "from-green-900/15 to-zinc-900",
    description: "Design-and-drive formula event where teams engineer their own electric or hybrid vehicle within a strict ruleset, then compete on a technical course.",
    format: [
      "Static judging — design report, cost analysis, business case",
      "Dynamic events — acceleration run, autocross, endurance lap",
      "Combined score determines overall champion",
      "Sustainability bonus points for eco-friendly materials",
    ],
    eligibility: [
      "Undergraduate or postgraduate students",
      "Team of 2–8 members",
      "Faculty advisor mandatory",
      "Vehicle must meet Formula Green technical regulations",
    ],
    dates: [
      { label: "Design Report Due",   value: "Jan 31, 2027"  },
      { label: "Registration Closes", value: "Feb 15, 2027"  },
      { label: "Static Judging",      value: "Mar 14, 2027"  },
      { label: "Dynamic Events",      value: "Mar 15, 2027"  },
    ],
    faqs: [
      { q: "Can we use a combustion engine?", a: "Only electric or hybrid powertrains are permitted under Formula Green regulations." },
      { q: "Is there a vehicle cost cap?",    a: "Yes — vehicles must be built within a ₹3,00,000 cost cap per the published cost report rules." },
      { q: "Who judges the static events?",   a: "Industry professionals and academics from the motorsports and EV sectors." },
    ],
  },
};

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-zinc-800 rounded-xl overflow-hidden">
          <button className="w-full text-left px-4 py-3 flex items-center justify-between text-sm text-gray-300 hover:text-white transition-colors"
            onClick={() => setOpen(open === i ? null : i)}>
            <span>{item.q}</span>
            <motion.span animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-gray-600 ml-2 flex-shrink-0">▾</motion.span>
          </button>
          <AnimatePresence>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                <p className="px-4 pb-4 text-sm text-gray-500 leading-relaxed border-t border-zinc-800 pt-3">{item.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function EventsPanel() {
  const [tab, setTab] = useState<"go_kart" | "formula_green">("go_kart");
  const ev = EVENTS_DATA[tab];
  return (
    <div className="relative py-16 bg-black min-h-full overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <Image src="/images/racing/f1-race-9.jpg" alt="" fill className="object-cover" style={{ opacity: 0.12 }} quality={40}/>
        <div className="absolute inset-0 bg-gradient-to-b from-black/92 via-black/72 to-black/92"/>
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-5">
        <p className="text-red-500 text-xs font-bold uppercase tracking-[0.2em] mb-2">Championships</p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Choose Your Battle</h2>
        <p className="text-gray-500 mb-8">Two distinct championships. One season. Zero compromises.</p>

        <div className="flex gap-3 mb-7">
          {(["go_kart", "formula_green"] as const).map(key => (
            <motion.button key={key} onClick={() => setTab(key)} whileTap={{ scale: 0.97 }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === key ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                  : "bg-zinc-900 border border-zinc-800 text-gray-400 hover:text-white hover:border-zinc-700"}`}>
              {EVENTS_DATA[key].icon} {EVENTS_DATA[key].name}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className={`lg:col-span-2 bg-gradient-to-br ${ev.color} border border-zinc-800 rounded-2xl p-7 space-y-6`}>
                <div>
                  <span className="text-4xl">{ev.icon}</span>
                  <h3 className="text-2xl font-black text-white mt-3">{ev.name}</h3>
                  <p className="text-red-400 text-sm font-medium mt-1">{ev.tagline}</p>
                  <p className="text-gray-400 mt-3 leading-relaxed">{ev.description}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-[0.18em] font-bold mb-4">Event Format</p>
                  <ul className="space-y-3">
                    {ev.format.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                        <span className="bg-red-600/20 text-red-400 text-xs font-bold rounded-md px-1.5 py-0.5 flex-shrink-0 mt-0.5">{i+1}</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-[0.18em] font-bold mb-4">FAQ</p>
                  <Accordion items={ev.faqs}/>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <p className="text-xs text-gray-600 uppercase tracking-[0.18em] font-bold mb-4">Key Dates</p>
                  <div className="space-y-4">
                    {ev.dates.map(d => (
                      <div key={d.label}>
                        <p className="text-xs text-gray-600">{d.label}</p>
                        <p className="text-white text-sm font-semibold mt-0.5">{d.value}</p>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-zinc-800 text-xs text-gray-600">📍 Chennai, Tamil Nadu — Venue TBA</div>
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <p className="text-xs text-gray-600 uppercase tracking-[0.18em] font-bold mb-4">Eligibility</p>
                  <ul className="space-y-2.5">
                    {ev.eligibility.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                        <span className="text-green-500 flex-shrink-0 mt-0.5 font-bold">✓</span>{e}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href="/register">
                  <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="block bg-red-600 hover:bg-red-500 text-white text-center font-bold px-6 py-3 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] text-sm cursor-pointer">
                    Register →
                  </motion.span>
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Gallery Panel ─────────────────────────────────────────────────────────────
const GALLERY_ITEMS = [
  { type: "img",   span: "col-span-2 row-span-2", label: "Race Day Action",  src: "/images/racing/f1-race-1.jpg"  },
  { type: "img",   span: "",                       label: "Grid Assembly",    src: "/images/racing/f1-race-7.jpg"  },
  { type: "img",   span: "",                       label: "Tech Inspection",  src: "/images/racing/f1-race-10.jpg" },
  { type: "video", span: "col-span-2",             label: "Highlight Reel",   src: "/images/racing/f1-race-13.jpg" },
  { type: "img",   span: "",                       label: "Podium Moment",    src: "/images/racing/f1-race-14.jpg" },
  { type: "img",   span: "",                       label: "Pit Stop Action",  src: "/images/racing/f1-race-15.jpg" },
];

function GalleryPanel() {
  return (
    <div className="relative py-16 bg-zinc-950 min-h-full overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <Image src="/images/racing/f1-race-4.jpg" alt="" fill className="object-cover" style={{ opacity: 0.08 }} quality={30}/>
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/98 via-zinc-950/85 to-zinc-950/98"/>
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-5">
        <p className="text-red-500 text-xs font-bold uppercase tracking-[0.2em] mb-2">Gallery & Media</p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">From the Track</h2>
        <p className="text-gray-500 mb-8">Moments from our founders' past events. Season 1 content coming soon.</p>
        <div className="flex gap-2 mb-5">
          {["All", "Go-Kart", "Formula Green"].map((f, i) => (
            <button key={f} className={`text-xs px-4 py-1.5 rounded-full border transition-colors ${i === 0 ? "bg-red-600 border-red-600 text-white" : "border-zinc-800 text-gray-500 hover:text-white hover:border-zinc-600"}`}>{f}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 grid-rows-3 gap-3" style={{ height: "480px" }}>
          {GALLERY_ITEMS.map((item, i) => (
            <motion.div key={i} whileHover={{ scale: 1.02, zIndex: 10 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className={`${item.span} border border-zinc-800 rounded-xl overflow-hidden relative group cursor-pointer bg-zinc-900`}>
              <Image src={item.src} alt={item.label} fill className="object-cover transition-transform duration-700 group-hover:scale-110" quality={55}/>
              <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors duration-500"/>
              {item.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-12 h-12 bg-red-600/90 rounded-full flex items-center justify-center shadow-xl">
                    <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10"/>
              <div className="absolute bottom-2 left-3 z-20"><p className="text-sm text-white font-semibold drop-shadow">{item.label}</p></div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── News Panel ────────────────────────────────────────────────────────────────
const NEWS_ITEMS = [
  { tag: "Announcement", date: "June 1, 2025",  title: "Season 1 Registrations Now Open",        excerpt: "XSPEED Motorsports officially opens team registrations for both Go-Kart Racing and Formula Green Championship events. Early bird slots limited." },
  { tag: "Event Update", date: "May 20, 2025",  title: "Venue Partner Confirmed for March 2027", excerpt: "We're thrilled to confirm our main venue partner. Full venue details and site maps will be shared with registered teams in October 2026." },
  { tag: "Rulebook",     date: "May 10, 2025",  title: "Formula Green Tech Regs v1.0 Released",  excerpt: "The official technical rulebook for Formula Green Racing is now available for download. All teams must comply with published regulations by design report deadline." },
];

function NewsPanel() {
  const [email, setEmail] = useState("");
  const [subbed, setSubbed] = useState(false);
  return (
    <div className="relative py-16 bg-black min-h-full overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <Image src="/images/racing/f1-race-5.jpg" alt="" fill className="object-cover" style={{ opacity: 0.1 }} quality={35}/>
        <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95"/>
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <p className="text-red-500 text-xs font-bold uppercase tracking-[0.2em] mb-2">News & Updates</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-7">Stay in the Loop</h2>
            <div className="space-y-4">
              {NEWS_ITEMS.map((n, i) => (
                <motion.article key={i} whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 cursor-pointer group">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs bg-red-600/10 text-red-400 border border-red-600/20 px-2.5 py-0.5 rounded-full">{n.tag}</span>
                    <span className="text-xs text-gray-600">{n.date}</span>
                  </div>
                  <h3 className="text-white font-bold group-hover:text-red-400 transition-colors">{n.title}</h3>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{n.excerpt}</p>
                </motion.article>
              ))}
            </div>
          </div>
          <div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-2">Get Race Alerts</h3>
              <p className="text-gray-500 text-sm mb-5">Deadlines, rulebook drops, and event news — straight to your inbox.</p>
              {subbed ? (
                <div className="bg-green-900/20 border border-green-700/30 rounded-xl px-4 py-4 text-center">
                  <p className="text-green-400 text-sm font-semibold">✓ You're in!</p>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); if (email) setSubbed(true); }} className="space-y-3">
                  <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-red-600 transition-colors"/>
                  <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white text-sm font-bold py-2.5 rounded-lg transition-all">Subscribe →</button>
                </form>
              )}
              <div className="mt-5 pt-4 border-t border-zinc-800">
                <p className="text-xs text-gray-600 uppercase tracking-[0.18em] mb-3">Follow Us</p>
                <div className="flex gap-2 flex-wrap">
                  {["Instagram", "LinkedIn", "YouTube", "Twitter"].map(s => (
                    <a key={s} href="#" className="text-xs bg-zinc-800 hover:bg-zinc-700 text-gray-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors">{s}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sponsors Panel ────────────────────────────────────────────────────────────
const TIERS = [
  { rank: "Title",     amount: "₹5,00,000+", badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", border: "border-yellow-500/30", glow: "hover:shadow-[0_0_30px_rgba(234,179,8,0.15)]", perks: ["Championship naming rights", "Logo on all event banners & jerseys", "30-second spot in opening ceremony", "Dedicated social media campaign (10+ posts)", "Brand booth at venue", "VIP hospitality — 10 guests"] },
  { rank: "Gold",      amount: "₹2,00,000+", badge: "bg-orange-500/10 text-orange-400 border-orange-500/30", border: "border-orange-500/20", glow: "hover:shadow-[0_0_30px_rgba(251,146,60,0.12)]", perks: ["Logo on banners & certificates", "Brand mention in press release", "Social feature — 5 posts", "Logo on event T-shirts", "VIP hospitality — 5 guests"] },
  { rank: "Silver",    amount: "₹1,00,000+", badge: "bg-zinc-500/10 text-zinc-300 border-zinc-500/30",       border: "border-zinc-600/30",   glow: "hover:shadow-[0_0_30px_rgba(148,163,184,0.1)]", perks: ["Logo on main event backdrop", "Social media mention — 3 posts", "Brand listed on website", "3 complimentary entry passes"] },
  { rank: "Associate", amount: "₹50,000+",   badge: "bg-zinc-800 text-gray-500 border-zinc-700",             border: "border-zinc-800",      glow: "",                                              perks: ["Logo on event website", "Social media mention — 1 post", "Certificate of association"] },
];

function SponsorsPanel() {
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", tier: "", message: "" });
  const [sent, setSent] = useState(false);
  const inp = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-red-600 transition-colors";
  return (
    <div className="relative py-16 bg-zinc-950 min-h-full overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <Image src="/images/racing/f1-race-14.jpg" alt="" fill className="object-cover" style={{ opacity: 0.1 }} quality={35}/>
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/78 to-zinc-950/95"/>
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-5">
        <p className="text-red-500 text-xs font-bold uppercase tracking-[0.2em] mb-2">Sponsor Us</p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Power the Next<br/>Generation of Racers</h2>
        <p className="text-gray-500 max-w-xl mb-10">Put your brand in front of 1,000+ engineering students, faculty, and motorsports enthusiasts.</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[{ val: "50+", label: "Competing Teams" }, { val: "200+", label: "Student Participants" }, { val: "1K+", label: "Live Audience" }, { val: "10K+", label: "Social Media Reach" }].map(m => (
            <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center">
              <p className="text-3xl font-black text-white">{m.val}</p>
              <p className="text-xs text-gray-500 mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {TIERS.map(tier => (
            <motion.div key={tier.rank} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`bg-zinc-900 border ${tier.border} rounded-2xl p-6 flex flex-col transition-shadow ${tier.glow}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-bold">{tier.rank}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${tier.badge}`}>Sponsor</span>
              </div>
              <p className="text-2xl font-black text-white mb-4">{tier.amount}</p>
              <ul className="space-y-2 flex-1">
                {tier.perks.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                    <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>{p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 max-w-2xl mx-auto">
          <h3 className="text-white font-bold text-xl mb-5">Sponsor Inquiry</h3>
          {sent ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-white font-semibold">Thank you for your interest!</p>
              <p className="text-gray-500 text-sm mt-2">Our team will reach out within 48 hours.</p>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setSent(true); }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ f: "name", l: "Full Name", t: "text", ph: "Your name" }, { f: "company", l: "Company", t: "text", ph: "Brand / Company" }, { f: "email", l: "Email", t: "email", ph: "you@company.com" }, { f: "phone", l: "Phone", t: "tel", ph: "+91 98765 43210" }].map(x => (
                  <div key={x.f}>
                    <label className="text-xs text-gray-500 mb-1.5 block">{x.l}</label>
                    <input type={x.t} placeholder={x.ph} required value={(form as Record<string,string>)[x.f]} onChange={e => setForm(p => ({ ...p, [x.f]: e.target.value }))} className={inp}/>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Preferred Tier</label>
                <select value={form.tier} onChange={e => setForm(p => ({ ...p, tier: e.target.value }))} className={inp}>
                  <option value="">Select sponsorship tier</option>
                  {TIERS.map(t => <option key={t.rank} value={t.rank}>{t.rank} Sponsor — {t.amount}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Message (optional)</label>
                <textarea rows={3} placeholder="Any specific requirements or questions…" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className={`${inp} resize-none`}/>
              </div>
              <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all text-sm">
                Submit Inquiry →
              </motion.button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Contact Panel ─────────────────────────────────────────────────────────────
function ContactPanel() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", type: "general", message: "" });
  const [sent, setSent] = useState(false);
  const inp = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-red-600 transition-colors";
  return (
    <div className="relative py-16 bg-black min-h-full overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <Image src="/images/racing/f1-race-15.jpg" alt="" fill className="object-cover" style={{ opacity: 0.1 }} quality={35}/>
        <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95"/>
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-5">
        <p className="text-red-500 text-xs font-bold uppercase tracking-[0.2em] mb-2">Contact</p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Get in Touch</h2>
        <p className="text-gray-500 mb-10">Registration help, sponsorship enquiries, or media partnerships — we're fast.</p>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 space-y-5">
            {[
              { icon: "📧", label: "Email",     value: "info@xspeed.in",     href: "mailto:info@xspeed.in"     },
              { icon: "📱", label: "WhatsApp",  value: "+91 98765 43210",     href: "https://wa.me/919876543210" },
              { icon: "📍", label: "Location", value: "Chennai, Tamil Nadu",  href: null                        },
            ].map(c => (
              <div key={c.label} className="flex items-start gap-4">
                <span className="text-2xl w-10 flex-shrink-0 text-center">{c.icon}</span>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">{c.label}</p>
                  {c.href ? <a href={c.href} className="text-white hover:text-red-400 transition-colors text-sm">{c.value}</a> : <p className="text-white text-sm">{c.value}</p>}
                </div>
              </div>
            ))}
            <motion.a href="https://wa.me/919876543210" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 bg-green-900/15 border border-green-700/25 hover:border-green-600/40 rounded-xl p-4 transition-colors">
              <span className="text-2xl">💬</span>
              <div>
                <p className="text-green-400 text-sm font-bold">WhatsApp Direct</p>
                <p className="text-green-700 text-xs mt-0.5">Typically within 2 hours</p>
              </div>
            </motion.a>
          </div>
          <div className="lg:col-span-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7">
              <h3 className="text-white font-bold text-lg mb-5">Send a Message</h3>
              {sent ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✉️</div>
                  <p className="text-white font-semibold">Message received!</p>
                  <p className="text-gray-500 text-sm mt-2">We'll reply within 24 hours.</p>
                  <button onClick={() => setSent(false)} className="text-xs text-gray-600 hover:text-white mt-5 transition-colors">Send another →</button>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); setSent(true); }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">Name</label>
                      <input required type="text" placeholder="Your full name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inp}/>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">Email</label>
                      <input required type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inp}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Phone (optional)</label>
                    <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inp}/>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Enquiry Type</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={inp}>
                      <option value="general">General Enquiry</option>
                      <option value="registration">Registration Help</option>
                      <option value="sponsorship">Sponsorship</option>
                      <option value="media">Media / Press</option>
                      <option value="callback">Request Callback</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Message</label>
                    <textarea required rows={4} placeholder="Tell us how we can help…" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className={`${inp} resize-none`}/>
                  </div>
                  <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all text-sm">
                    Send Message →
                  </motion.button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer({ onSectionClick }: { onSectionClick: (s: string) => void }) {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 sm:col-span-1">
            <div className="mb-4"><XSpeedLogo size="sm"/></div>
            <p className="text-xs text-gray-600 leading-relaxed">XSPEED Motorsports Pvt. Ltd.<br/>India's premier student motorsports championship platform.</p>
          </div>
          {[
            { title: "Events", links: [
              { l: "Go-Kart Racing",   onClick: () => onSectionClick("events")   },
              { l: "Formula Green",    onClick: () => onSectionClick("events")   },
              { l: "Register Team",    href: "/register" },
            ]},
            { title: "Company", links: [
              { l: "About Us",         onClick: () => onSectionClick("about")    },
              { l: "News & Updates",   onClick: () => onSectionClick("news")     },
              { l: "Gallery",          onClick: () => onSectionClick("gallery")  },
            ]},
            { title: "Get Involved", links: [
              { l: "Sponsor Us",       onClick: () => onSectionClick("sponsors") },
              { l: "Contact",          onClick: () => onSectionClick("contact")  },
              { l: "Login",            href: "/login"    },
              { l: "Register",         href: "/register" },
            ]},
          ].map(col => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-600 mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.l}>
                    {"href" in l && l.href ? (
                      <Link href={l.href} className="text-sm text-gray-600 hover:text-white transition-colors">{l.l}</Link>
                    ) : (
                      <button onClick={(l as { l: string; onClick: () => void }).onClick} className="text-sm text-gray-600 hover:text-white transition-colors">{l.l}</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-zinc-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-700">
          <p>© 2025 XSPEED Motorsports Pvt. Ltd. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Card-expand view ──────────────────────────────────────────────────────────
const SECTION_LABELS: Record<string, string> = {
  about: "About", events: "Events", gallery: "Gallery",
  news: "News", sponsors: "Sponsors", contact: "Contact",
};

// Each section maps to a card (for header image when navigating via pills)
const SECTION_TO_CARD: Record<string, CardItem> = {
  about:    { imgUrl: "/images/racing/f1-race-2.jpg", name: "About",    role: "Our Story & Mission",     number: "01" },
  events:   { imgUrl: "/images/racing/f1-race-3.jpg", name: "Events",   role: "Go-Kart & Formula Green", number: "02" },
  gallery:  { imgUrl: "/images/racing/f1-race-4.jpg", name: "Gallery",  role: "Media & Race Photos",     number: "03" },
  news:     { imgUrl: "/images/racing/f1-race-5.jpg", name: "News",     role: "Latest Season Updates",   number: "04" },
  sponsors: { imgUrl: "/images/racing/f1-race-6.jpg", name: "Sponsors", role: "Partner With XSPEED",     number: "05" },
  contact:  { imgUrl: "/images/racing/f1-race-11.jpg", name: "Contact",  role: "Get in Touch",            number: "06" },
};

function CardExpandedView({
  expanded,
  onClose,
  onNav,
}: {
  expanded: { card: CardItem; section: string } | null;
  onClose: () => void;
  onNav: (section: string) => void;
}) {
  const panelMap: Record<string, React.ReactNode> = {
    about:    <AboutPanel />,
    events:   <EventsPanel />,
    gallery:  <GalleryPanel />,
    news:     <NewsPanel />,
    sponsors: <SponsorsPanel />,
    contact:  <ContactPanel />,
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top when section changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [expanded?.section]);

  return (
    <AnimatePresence>
      {expanded && (
        <motion.div
          key="card-expanded"
          initial={{ scale: 0.06, opacity: 0, borderRadius: "2rem" }}
          animate={{ scale: 1, opacity: 1, borderRadius: "0rem" }}
          exit={{ scale: 0.06, opacity: 0, borderRadius: "2rem" }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed inset-0 z-[80] bg-black flex flex-col overflow-hidden"
        >
          {/* ── Card image hero (top ~38% of screen) ── */}
          <div className="relative flex-shrink-0" style={{ height: "38vh", minHeight: "220px" }}>
            {/* Card photo */}
            <AnimatePresence mode="wait">
              <motion.img
                key={expanded.card.imgUrl}
                src={expanded.card.imgUrl}
                alt={expanded.card.name}
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Dark gradient — heaviest at bottom for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/95" />

            {/* Red top accent line — matches the fan card */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-transparent z-10" />

            {/* Close button — top right */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-9 h-9 bg-black/60 hover:bg-black/90 backdrop-blur rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            {/* Card identity — bottom of image area */}
            <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-4">
              <div className="flex items-center gap-2.5 mb-1.5">
                {/* Number badge */}
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/50 flex-shrink-0">
                  <span className="text-white font-black text-[11px]">{expanded.card.number}</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    {expanded.card.name}
                  </h1>
                  <p className="text-red-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                    {expanded.card.role}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section nav pills (sticky below image) ── */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-zinc-950 border-b border-zinc-800 overflow-x-auto no-scrollbar">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-gray-500 hover:text-white text-xs font-semibold mr-2 flex-shrink-0 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <div className="w-px h-4 bg-zinc-700 mr-2 flex-shrink-0" />
            {Object.entries(SECTION_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => onNav(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                  expanded.section === key
                    ? "bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.4)]"
                    : "text-gray-500 hover:text-white bg-zinc-900 hover:bg-zinc-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Scrollable section content ── */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={expanded.section}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {panelMap[expanded.section] ?? null}
              </motion.div>
            </AnimatePresence>
            <Footer onSectionClick={onNav} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── LANDING PAGE ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [showIntro, setShowIntro] = useState(true);
  const [expanded, setExpanded] = useState<{ card: CardItem; section: string } | null>(null);

  const openSection = (section: string, card?: CardItem) => {
    if (!section || !SECTION_LABELS[section]) return;
    setExpanded({ card: card ?? SECTION_TO_CARD[section], section });
  };

  const navToSection = (section: string) => {
    if (!SECTION_LABELS[section]) return;
    setExpanded({ card: SECTION_TO_CARD[section], section });
  };

  return (
    <main className="bg-black text-white h-screen overflow-hidden">
      <AnimatePresence>
        {showIntro && <RacingIntroAnimation onComplete={() => setShowIntro(false)} />}
      </AnimatePresence>

      <Navbar onSectionClick={(s) => openSection(s)} />

      <HeroSection
        onCardClick={(card, section) => openSection(section, card)}
      />

      <CardExpandedView
        expanded={expanded}
        onClose={() => setExpanded(null)}
        onNav={navToSection}
      />
    </main>
  );
}
