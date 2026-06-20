"use client";

// ── Inline Haikei-style SVG backgrounds ──────────────────────────────────────
// These are generated using haikei.app patterns, embedded as React components.

/** Layered wave SVG for page bottoms */
export function HaikeiWave({ opacity = 0.4, color = "#dc2626" }: { opacity?: number; color?: string }) {
  return (
    <svg
      className="absolute bottom-0 left-0 w-full pointer-events-none"
      viewBox="0 0 1440 220"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <path
        fill={color}
        fillOpacity="0.06"
        d="M0,128L48,117.3C96,107,192,85,288,90.7C384,96,480,128,576,138.7C672,149,768,139,864,122.7C960,107,1056,85,1152,90.7C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      />
      <path
        fill={color}
        fillOpacity="0.04"
        d="M0,192L48,181.3C96,171,192,149,288,144C384,139,480,149,576,160C672,171,768,181,864,170.7C960,160,1056,128,1152,122.7C1248,117,1344,139,1392,149.3L1440,160L1440,320L0,320Z"
      />
    </svg>
  );
}

/** Blob shapes for hero sections */
export function HaikeiBlobs({ opacity = 0.6 }: { opacity?: number }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <defs>
        <radialGradient id="blob1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#dc2626" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="blob2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#b91c1c" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#b91c1c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="200" rx="320" ry="260" fill="url(#blob1)" />
      <ellipse cx="1000" cy="600" rx="280" ry="220" fill="url(#blob2)" />
    </svg>
  );
}

/** Dots grid background */
export function HaikeiDots({ opacity = 0.3 }: { opacity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    />
  );
}

/** Checkered flag strip (racing theme) */
export function CheckeredStrip({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <div
      className="absolute inset-x-0 pointer-events-none"
      style={{
        height: 8,
        opacity,
        backgroundImage:
          "repeating-linear-gradient(90deg, #fff 0px, #fff 16px, #000 16px, #000 32px)",
      }}
    />
  );
}
