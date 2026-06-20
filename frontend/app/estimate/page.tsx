"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { AnimatedCar } from "@/components/RacingCar";
import { RacingImageBackground } from "@/components/RacingImageBackground";

interface EventOption {
  slug: string;
  display_name: string;
  max_members: number;
  registration_open: boolean;
}

interface Estimate {
  event_name: string;
  member_count: number;
  registration_fee: number;
  per_member_fee: number;
  per_member_total: number;
  subtotal: number;
  gst_percentage: number;
  gst_amount: number;
  grand_total: number;
}

export default function EstimatePage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [memberCount, setMemberCount] = useState(1);
  const [maxMembers, setMaxMembers] = useState(5);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/events")
      .then((res) => {
        setEvents(res.data);
        if (res.data.length > 0) {
          setSelectedSlug(res.data[0].slug);
          setMaxMembers(res.data[0].max_members);
        }
      })
      .finally(() => setEventsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;
    const ev = events.find((e) => e.slug === selectedSlug);
    if (ev) {
      setMaxMembers(ev.max_members);
      setMemberCount((prev) => Math.min(prev, ev.max_members));
    }
  }, [selectedSlug, events]);

  async function calculate() {
    if (!selectedSlug) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/events/${selectedSlug}/estimate?members=${memberCount}`);
      setEstimate(res.data);
    } catch {
      setEstimate(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden py-10">

      {/* Real racing photo background */}
      <RacingImageBackground src="/images/racing/f1-race-5.jpg" opacity={0.18} gradient="dark" />

      {/* Grid */}
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px] pointer-events-none" />
      {/* Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-red-700/7 rounded-full blur-[120px] pointer-events-none" />

      {/* Go-kart in background */}
      <AnimatedCar type="kart" dir="rtl" size={460} opacity={0.045} duration={24} top="55%" />

      <div className="relative z-10 max-w-lg mx-auto px-4">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link href="/" className="text-gray-500 hover:text-white text-sm transition-colors">
            ← Home
          </Link>
          <h1 className="text-3xl font-bold mt-3">Fee Estimator</h1>
          <p className="text-gray-400 mt-1">
            Calculate your registration fee before signing up — no account required.
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="bg-zinc-900/80 backdrop-blur border border-white/6 rounded-2xl p-6 mb-6 space-y-5 shadow-xl"
        >

          {/* Event selector */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Select Event</label>
            {eventsLoading ? (
              <div className="w-full p-3 rounded-lg bg-zinc-800 text-gray-600 text-sm animate-pulse">Loading events…</div>
            ) : (
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/8 text-white outline-none focus:border-red-600/60 focus:ring-1 focus:ring-red-600/30 transition-all text-sm"
              >
                {events.map((ev) => (
                  <option key={ev.slug} value={ev.slug} className="bg-zinc-900">
                    {ev.display_name}{!ev.registration_open ? " (Registration Closed)" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Member count */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
              Number of Members
              <span className="text-gray-700 normal-case ml-2">(max {maxMembers})</span>
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setMemberCount((n) => Math.max(1, n - 1))}
                className="w-11 h-11 bg-zinc-800 hover:bg-zinc-700 border border-white/6 rounded-lg text-xl font-bold transition-colors"
              >
                −
              </button>
              <span className="text-4xl font-black w-12 text-center tabular-nums">{memberCount}</span>
              <button
                type="button"
                onClick={() => setMemberCount((n) => Math.min(maxMembers, n + 1))}
                className="w-11 h-11 bg-zinc-800 hover:bg-zinc-700 border border-white/6 rounded-lg text-xl font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={calculate}
            disabled={loading || !selectedSlug}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-red-900/20 hover:shadow-red-900/40 text-sm"
          >
            {loading ? "Calculating…" : "Calculate Fee"}
          </button>
        </motion.div>

        {/* Estimate result */}
        <AnimatePresence>
          {estimate && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-zinc-900/80 backdrop-blur border border-white/8 rounded-2xl p-6 mb-6 shadow-xl"
            >
              <h2 className="text-base font-semibold mb-5 text-gray-200 uppercase tracking-wider text-xs">
                Fee Breakdown — {estimate.event_name}
              </h2>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Registration Fee (base)</span>
                  <span className="text-white">₹{estimate.registration_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Per Member ({estimate.member_count} × ₹{estimate.per_member_fee.toFixed(2)})</span>
                  <span className="text-white">₹{estimate.per_member_total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-white/6 pt-2.5 text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white">₹{estimate.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>GST ({estimate.gst_percentage}%)</span>
                  <span className="text-white">₹{estimate.gst_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-white/6 pt-3 text-base font-bold">
                  <span>Total Payable</span>
                  <span className="text-emerald-400 text-lg">₹{estimate.grand_total.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-700 mt-5 leading-relaxed">
                Prices include GST. Payment processed securely via Razorpay. Fees subject to change until confirmed.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-3"
        >
          <p className="text-gray-600 text-sm">Ready to register your team?</p>
          <Link
            href="/register"
            className="inline-block w-full bg-red-600 hover:bg-red-500 py-3 rounded-lg font-semibold transition-all duration-200 text-center shadow-lg shadow-red-900/20 hover:shadow-red-900/40 text-sm"
          >
            Register Now
          </Link>
          <Link
            href="/login"
            className="inline-block w-full bg-zinc-900 hover:bg-zinc-800 border border-white/5 py-3 rounded-lg text-sm transition-colors text-center text-gray-400 hover:text-white"
          >
            Already have an account? Sign In
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
