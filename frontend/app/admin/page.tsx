"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface Stats {
  total_teams: number;
  by_event: Record<string, number>;
  by_status: Record<string, number>;
  documents: { pending: number; approved: number; rejected: number };
  payments: { paid_count: number; total_amount_inr: number };
}

interface RecentTeam {
  id: number;
  registration_id: string;
  team_name: string;
  event_slug: string;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  submitted:    "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  payment_done: "bg-blue-400/10   text-blue-400   border-blue-400/20",
  under_review: "bg-purple-400/10 text-purple-400 border-purple-400/20",
  approved:     "bg-green-400/10  text-green-400  border-green-400/20",
  rejected:     "bg-red-400/10    text-red-400    border-red-400/20",
  waitlisted:   "bg-orange-400/10 text-orange-400 border-orange-400/20",
};

const EVENT_LABELS: Record<string, string> = {
  go_kart:       "Go-Kart Racing",
  formula_green: "Formula Green",
};

function StatCard({ label, value, sub, color = "text-white" }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/admin/stats"),
      api.get("/api/admin/teams?limit=8"),
    ])
      .then(([statsRes, teamsRes]) => {
        setStats(statsRes.data);
        setRecent(teamsRes.data.teams);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">Loading…</p>;
  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">XSPEED Season 1 — Registration Overview</p>
      </div>

      {/* Primary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Teams"     value={stats.total_teams} />
        <StatCard label="Payments Received" value={stats.payments.paid_count}
          sub={`₹${stats.payments.total_amount_inr.toLocaleString("en-IN")} collected`}
          color="text-green-400" />
        <StatCard label="Docs Pending Review" value={stats.documents.pending}
          color={stats.documents.pending > 0 ? "text-yellow-400" : "text-white"} />
        <StatCard label="Docs Rejected" value={stats.documents.rejected}
          color={stats.documents.rejected > 0 ? "text-red-400" : "text-white"} />
      </div>

      {/* By event + by status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Registrations by Event</h2>
          <div className="space-y-3">
            {Object.entries(stats.by_event).map(([slug, count]) => (
              <div key={slug} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{EVENT_LABELS[slug] ?? slug}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 rounded-full"
                      style={{ width: stats.total_teams > 0 ? `${(count / stats.total_teams) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Registrations by Status</h2>
          <div className="space-y-2">
            {Object.entries(stats.by_status)
              .filter(([, count]) => count > 0)
              .map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[status] ?? "text-gray-400 bg-zinc-800 border-zinc-700"}`}>
                    {status.replace("_", " ")}
                  </span>
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              ))}
            {Object.values(stats.by_status).every(v => v === 0) && (
              <p className="text-gray-600 text-sm">No registrations yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick action alerts */}
      {(stats.documents.pending > 0 || stats.documents.rejected > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.documents.pending > 0 && (
            <Link href="/admin/documents?status=pending"
              className="flex items-center justify-between bg-yellow-900/15 border border-yellow-700/30 rounded-xl px-4 py-3 hover:border-yellow-600/50 transition-colors">
              <p className="text-sm text-yellow-300">{stats.documents.pending} document(s) awaiting review</p>
              <span className="text-xs text-yellow-400">Review →</span>
            </Link>
          )}
          {stats.documents.rejected > 0 && (
            <Link href="/admin/documents?status=rejected"
              className="flex items-center justify-between bg-red-900/15 border border-red-700/30 rounded-xl px-4 py-3 hover:border-red-600/50 transition-colors">
              <p className="text-sm text-red-300">{stats.documents.rejected} document(s) rejected</p>
              <span className="text-xs text-red-400">View →</span>
            </Link>
          )}
        </div>
      )}

      {/* Recent registrations */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-gray-300">Recent Registrations</h2>
          <Link href="/admin/teams" className="text-xs text-red-400 hover:text-red-300">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-zinc-800">
          {recent.length === 0 && (
            <p className="text-gray-500 text-sm px-5 py-4">No registrations yet.</p>
          )}
          {recent.map((t) => (
            <Link key={t.id} href={`/admin/teams/${t.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-white">{t.team_name}</p>
                <p className="text-xs text-gray-500">{t.registration_id} · {EVENT_LABELS[t.event_slug] ?? t.event_slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[t.status] ?? "text-gray-400 bg-zinc-800 border-zinc-700"}`}>
                  {t.status.replace("_", " ")}
                </span>
                <span className="text-xs text-gray-600">
                  {t.created_at ? new Date(t.created_at).toLocaleDateString("en-IN") : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
