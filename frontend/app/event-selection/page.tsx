"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { isAuthenticated } from "@/lib/auth";
import { AnimatedCar } from "@/components/RacingCar";
import { RacingImageBackground } from "@/components/RacingImageBackground";

const FU = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
} as const;

const STAGGER = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const CARD = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  show:   { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

export default function EventSelectionPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col items-center justify-center">

      {/* Real racing photo background */}
      <RacingImageBackground src="/images/racing/f1-race-3.jpg" opacity={0.2} gradient="red" />

      {/* Grid */}
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:64px_64px] pointer-events-none" />

      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-red-700/10 rounded-full blur-[120px] pointer-events-none" />
      {/* Bottom glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-orange-700/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Formula car — top area, right to left */}
      <AnimatedCar type="formula" dir="rtl" size={500} opacity={0.055} duration={26} top="12%" />
      {/* Go-kart — lower area, left to right */}
      <AnimatedCar type="kart"    dir="ltr" size={400} opacity={0.055} duration={20} delay={8} bottom="12%" />

      {/* Content */}
      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center"
      >
        {/* Header */}
        <motion.div variants={FU} className="text-center mb-12">
          <p className="text-red-500 text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            Step 1 of 3
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            Select Your Event
          </h1>
          <p className="text-gray-400 text-base max-w-sm">
            Choose the racing category you wish to compete in. Each event has different regulations and fee structures.
          </p>
        </motion.div>

        {/* Event cards */}
        <div className="flex flex-col sm:flex-row gap-6">

          {/* Go Kart */}
          <motion.div
            variants={CARD}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/team-registration?event=go_kart")}
            className="group relative bg-zinc-900/80 backdrop-blur border border-white/8 hover:border-red-600/40 p-10 rounded-2xl cursor-pointer text-center w-[260px] transition-all duration-300 shadow-xl hover:shadow-red-900/20 hover:shadow-2xl overflow-hidden"
          >
            {/* Hover glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-600/0 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

            {/* Icon */}
            <div className="relative text-6xl mb-5 select-none group-hover:scale-110 transition-transform duration-300 inline-block">
              🏎️
            </div>

            <h2 className="text-xl font-bold mb-2 text-white">Go Kart Racing</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Entry-level racing for beginners and intermediate drivers. Compact karts, tight circuits.
            </p>

            <div className="mt-6 flex items-center justify-center gap-2 text-red-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Register Team →
            </div>
          </motion.div>

          {/* Formula Green */}
          <motion.div
            variants={CARD}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/team-registration?event=formula_green")}
            className="group relative bg-zinc-900/80 backdrop-blur border border-white/8 hover:border-red-600/40 p-10 rounded-2xl cursor-pointer text-center w-[260px] transition-all duration-300 shadow-xl hover:shadow-red-900/20 hover:shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-red-600/0 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

            <div className="relative text-6xl mb-5 select-none group-hover:scale-110 transition-transform duration-300 inline-block">
              🏁
            </div>

            <h2 className="text-xl font-bold mb-2 text-white">Formula Green</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              High-performance open-wheel formula racing with eco-friendly technology.
            </p>

            <div className="mt-6 flex items-center justify-center gap-2 text-red-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Register Team →
            </div>
          </motion.div>
        </div>

        {/* Footer hint */}
        <motion.p variants={FU} className="text-gray-600 text-xs mt-10">
          You can register for both events separately.
        </motion.p>
      </motion.div>
    </div>
  );
}
