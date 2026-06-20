"use client";

import { motion } from "framer-motion";

/** Animated success checkmark — replaces a static emoji or Lottie file */
export function SuccessCheckmark({ size = 96 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 80 80" width={size} height={size} fill="none">
        {/* Green circle drawing itself */}
        <motion.circle
          cx="40" cy="40" r="36"
          stroke="#22c55e"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        {/* Checkmark */}
        <motion.path
          d="M22 40 L34 52 L58 28"
          stroke="#22c55e"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
        />
      </svg>
    </div>
  );
}

/** Upload arrow animation */
export function UploadIcon({ size = 48, active = false }: { size?: number; active?: boolean }) {
  return (
    <motion.div
      animate={active ? { y: [0, -6, 0] } : {}}
      transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <motion.path
          d="M24 32 L24 16 M16 24 L24 16 L32 24"
          stroke={active ? "#dc2626" : "#71717a"}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={active ? { stroke: ["#dc2626", "#ef4444", "#dc2626"] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <path
          d="M12 36 L36 36"
          stroke={active ? "#dc2626" : "#71717a"}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}

/** Spinning racing loader */
export function RacingLoader({ size = 40 }: { size?: number }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
        <circle cx="20" cy="20" r="16" stroke="#27272a" strokeWidth="3" />
        <path
          d="M20 4 A 16 16 0 0 1 36 20"
          stroke="#dc2626"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}

/** Pulsing dot for "active / current" step */
export function PulseDot({ color = "#dc2626" }: { color?: string }) {
  return (
    <span className="relative inline-flex">
      <motion.span
        className="absolute inline-flex w-full h-full rounded-full opacity-75"
        style={{ backgroundColor: color }}
        animate={{ scale: [1, 2], opacity: [0.5, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
      />
      <span className="relative inline-flex w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

/** Payment amount roll-in (counts up from 0) */
export function AmountReveal({ amount, currency = "₹", className = "" }: { amount: number; currency?: string; className?: string }) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "backOut" }}
    >
      {currency}{amount.toFixed(2)}
    </motion.span>
  );
}
