"use client";

import { motion } from "framer-motion";

// ── Formula Car SVG (side view, faces right) ─────────────────────────────────
function FormulaCar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 310 105" className={className} fill="none" xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round" strokeLinejoin="round">
      {/* Speed lines (behind car, left side) */}
      <line x1="-58" y1="52" x2="-16" y2="52" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <line x1="-70" y1="60" x2="-22" y2="60" stroke="currentColor" strokeWidth="1"   opacity="0.35"/>
      <line x1="-50" y1="68" x2="-14" y2="68" stroke="currentColor" strokeWidth="0.8" opacity="0.25"/>

      {/* Main body */}
      <path d="M8 66 L52 53 L80 45 L122 41 L178 40 L218 43 L254 55 L260 63 L260 70 L52 70 Z"
        stroke="currentColor" strokeWidth="1.8"/>
      {/* Nose extension */}
      <path d="M8 66 L2 68 L52 70" stroke="currentColor" strokeWidth="1.5"/>

      {/* Cockpit */}
      <path d="M134 41 L150 24 L188 24 L200 41" stroke="currentColor" strokeWidth="1.8"/>
      {/* Cockpit inner */}
      <path d="M142 41 L156 28 L186 28 L195 41" stroke="currentColor" strokeWidth="0.8" opacity="0.4"/>

      {/* Front wing */}
      <path d="M8 66 L5 75 L40 75 L46 66" stroke="currentColor" strokeWidth="1.6"/>

      {/* Rear wing — vertical strut */}
      <line x1="250" y1="57" x2="250" y2="27" stroke="currentColor" strokeWidth="1.8"/>
      {/* Rear wing — blade */}
      <path d="M230 27 L280 27" stroke="currentColor" strokeWidth="2.2"/>
      {/* End plates */}
      <line x1="230" y1="27" x2="230" y2="40" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="280" y1="27" x2="280" y2="40" stroke="currentColor" strokeWidth="1.5"/>

      {/* Front wheel */}
      <ellipse cx="70" cy="78" rx="14" ry="16" stroke="currentColor" strokeWidth="2.2"/>
      <ellipse cx="70" cy="78" rx="5"  ry="5"  stroke="currentColor" strokeWidth="1"   opacity="0.45"/>

      {/* Rear wheel */}
      <ellipse cx="224" cy="74" rx="16" ry="18" stroke="currentColor" strokeWidth="2.2"/>
      <ellipse cx="224" cy="74" rx="6"  ry="6"  stroke="currentColor" strokeWidth="1"   opacity="0.45"/>

      {/* Exhaust */}
      <path d="M253 58 L264 55 L268 58" stroke="currentColor" strokeWidth="1.2" opacity="0.5"/>
    </svg>
  );
}

// ── Go-Kart SVG (side view, faces right) ────────────────────────────────────
function GoKartCar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 290 105" className={className} fill="none" xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round" strokeLinejoin="round">
      {/* Speed lines */}
      <line x1="-58" y1="46" x2="-16" y2="46" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <line x1="-70" y1="54" x2="-22" y2="54" stroke="currentColor" strokeWidth="1"   opacity="0.35"/>
      <line x1="-52" y1="62" x2="-14" y2="62" stroke="currentColor" strokeWidth="0.8" opacity="0.25"/>

      {/* Main body */}
      <path d="M22 54 L32 43 L70 39 L200 39 L234 43 L258 54 L258 65 L22 65 Z"
        stroke="currentColor" strokeWidth="1.8"/>

      {/* Driver cockpit surround */}
      <path d="M88 39 L93 27 L178 27 L184 39" stroke="currentColor" strokeWidth="1.8"/>
      {/* Seat back */}
      <path d="M150 27 L150 19 L178 19 L178 27" stroke="currentColor" strokeWidth="1.5"/>

      {/* Steering wheel */}
      <circle cx="125" cy="24" r="9"  stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="125" cy="24" r="2.5" stroke="currentColor" strokeWidth="1"   opacity="0.5"/>
      {/* Steering column */}
      <line x1="125" y1="33" x2="125" y2="39" stroke="currentColor" strokeWidth="1.2"/>

      {/* Front bumper */}
      <path d="M22 54 L16 59 L16 65 L22 65" stroke="currentColor" strokeWidth="1.6"/>
      {/* Rear bumper */}
      <path d="M258 54 L264 59 L264 65 L258 65" stroke="currentColor" strokeWidth="1.6"/>

      {/* Axle bars */}
      <line x1="44"  y1="65" x2="44"  y2="71" stroke="currentColor" strokeWidth="2"/>
      <line x1="222" y1="65" x2="222" y2="71" stroke="currentColor" strokeWidth="2"/>

      {/* Front wheel */}
      <ellipse cx="44" cy="74" rx="14" ry="15" stroke="currentColor" strokeWidth="2.2"/>
      <ellipse cx="44" cy="74" rx="5"  ry="5"  stroke="currentColor" strokeWidth="1"   opacity="0.45"/>

      {/* Rear wheel */}
      <ellipse cx="222" cy="73" rx="16" ry="17" stroke="currentColor" strokeWidth="2.2"/>
      <ellipse cx="222" cy="73" rx="6"  ry="6"  stroke="currentColor" strokeWidth="1"   opacity="0.45"/>
    </svg>
  );
}

// ── Animated sliding car (enters one side, exits the other) ──────────────────
interface AnimatedCarProps {
  type?: "formula" | "kart";
  /** "ltr" = left→right (car faces right). "rtl" = right→left (car faces left). */
  dir?: "ltr" | "rtl";
  size?: number;        // width in px
  opacity?: number;
  duration?: number;   // seconds for one pass
  delay?: number;
  top?: string;
  bottom?: string;
  className?: string;
}

export function AnimatedCar({
  type = "formula",
  dir = "rtl",
  size = 480,
  opacity = 0.065,
  duration = 24,
  delay = 0,
  top,
  bottom,
  className = "",
}: AnimatedCarProps) {
  const Car = type === "formula" ? FormulaCar : GoKartCar;
  // ltr: car moves left→right, faces right (no flip)
  // rtl: car moves right→left, faces left (flip X)
  const fromX = dir === "ltr" ? "-30%" : "110vw";
  const toX   = dir === "ltr" ? "110vw" : "-30%";

  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      style={{
        top, bottom,
        width: size,
        opacity,
        scaleX: dir === "rtl" ? -1 : 1,
      }}
      animate={{ x: [fromX, toX] }}
      transition={{ duration, ease: "linear", repeat: Infinity, delay }}
    >
      <Car className="w-full h-auto text-white" />
    </motion.div>
  );
}

// ── Static / floating car (decorative corner element) ───────────────────────
interface StaticCarProps {
  type?: "formula" | "kart";
  size?: number;
  opacity?: number;
  flip?: boolean;
  float?: boolean;
  className?: string;
}

export function StaticCar({
  type = "formula",
  size = 380,
  opacity = 0.05,
  flip = false,
  float = true,
  className = "",
}: StaticCarProps) {
  const Car = type === "formula" ? FormulaCar : GoKartCar;
  return (
    <motion.div
      className={`pointer-events-none ${className}`}
      style={{ width: size, scaleX: flip ? -1 : 1 }}
      animate={float ? {
        y: [0, -10, 0],
        opacity: [opacity, opacity * 1.5, opacity],
      } : { opacity }}
      transition={float ? { duration: 4.5, ease: "easeInOut", repeat: Infinity } : undefined}
    >
      <Car className="w-full h-auto text-white" />
    </motion.div>
  );
}
