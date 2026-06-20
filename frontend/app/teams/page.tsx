"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { AnimatedCar } from "@/components/RacingCar";
import { RacingImageBackground } from "@/components/RacingImageBackground";

interface PublicTeam {
  team_name: string;
  institution: string;
  city: string;
  event_slug: string;
  status: string;
}

const EVENT_LABELS: Record<string, string> = {
  go_kart: "Go-Kart Racing",
  formula_green: "Formula Green Racing",
};

const statusBadge: Record<string, string> = {
  submitted:    "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20",
  payment_done: "bg-blue-400/10   text-blue-400   border border-blue-400/20",
  approved:     "bg-green-400/10  text-green-400  border border-green-400/20",
};

const FU = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
} as const;

const LIST = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<PublicTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "go_kart" | "formula_green">("all");

  useEffect(() => {
    api
      .get("/api/teams/public")
      .then((res) => setTeams(res.data))
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? teams : teams.filter((t) => t.event_slug === filter);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden py-10">

      {/* Real racing photo background */}
      <RacingImageBackground src="/images/racing/f1-race-4.jpg" opacity={0.18} gradient="dark" />

      {/* Grid */}
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px] pointer-events-none" />
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-red-700/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Formula car in background */}
      <AnimatedCar type="formula" dir="ltr" size={500} opacity={0.04} duration={30} top="60%" />

      <div className="relative z-10 max-w-4xl mx-auto px-4">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link href="/" className="text-gray-500 hover:text-white text-sm transition-colors">
            ← Home
          </Link>
          <h1 className="text-3xl font-bold mt-3">Registered Teams</h1>
          <p className="text-gray-400 mt-1">All teams registered for XSPEED 2026</p>
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex gap-2 mb-6"
        >
          {(["all", "go_kart", "formula_green"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === f
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/20"
                  : "bg-zinc-900 border border-white/5 text-gray-400 hover:text-white hover:border-white/10"
              }`}
            >
              {f === "all" ? "All Events" : EVENT_LABELS[f]}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="text-center py-24 text-gray-600 animate-pulse">Loading teams…</div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <p className="text-gray-500 text-lg mb-4">No teams registered yet.</p>
            <Link
              href="/event-selection"
              className="inline-block bg-red-600 hover:bg-red-500 px-6 py-2.5 rounded-lg transition-colors text-sm font-medium"
            >
              Register Your Team
            </Link>
          </motion.div>
        ) : (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 text-sm mb-4"
            >
              {filtered.length} team{filtered.length !== 1 ? "s" : ""} found
            </motion.p>

            <motion.div
              variants={LIST}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {filtered.map((team, i) => (
                <motion.div
                  key={i}
                  variants={FU}
                  className="bg-zinc-900/80 backdrop-blur border border-white/5 hover:border-white/10 rounded-xl p-4 flex items-center justify-between transition-all duration-200 hover:bg-zinc-900"
                >
                  <div>
                    <p className="font-semibold text-white">{team.team_name}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{team.institution}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{team.city}</p>
                  </div>
                  <div className="text-right space-y-1.5">
                    <p className="text-xs text-gray-500">{EVENT_LABELS[team.event_slug] ?? team.event_slug}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusBadge[team.status] ?? "bg-zinc-800 text-gray-400"}`}>
                      {team.status.replace("_", " ")}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}

      </div>
    </div>
  );
}
