"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";

interface Team {
  id: number;
  registration_id: string;
  team_name: string;
  institution: string;
  city: string;
  state: string;
  event_slug: string;
  status: string;
  member_count: number;
  payment_status: string | null;
  docs_uploaded: number;
  docs_approved: number;
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
  go_kart: "Go-Kart", formula_green: "Formula Green",
};

function TeamsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [teams, setTeams]   = useState<Team[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  const [q,     setQ]     = useState(searchParams.get("q")     ?? "");
  const [event, setEvent] = useState(searchParams.get("event") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [page, setPage] = useState(0);
  const PER_PAGE = 20;

  const fetchTeams = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      q, event_slug: event, status, skip: String(page * PER_PAGE), limit: String(PER_PAGE),
    });
    api.get(`/api/admin/teams?${params}`)
      .then(res => { setTeams(res.data.teams); setTotal(res.data.total); })
      .finally(() => setLoading(false));
  }, [q, event, status, page]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  async function handleExport() {
    try {
      const token = getToken();
      const params = new URLSearchParams({ event_slug: event, status });
      const res = await fetch(
        `http://localhost:8000/api/admin/teams/export?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "xspeed_teams.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  }

  const inp  = "bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-red-600 transition-colors";
  const sel  = `${inp} pr-8`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-gray-500 text-sm mt-1">{total} registration{total !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={handleExport}
          className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded text-sm transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text" placeholder="Search name / ID / institution…"
          value={q} onChange={e => { setQ(e.target.value); setPage(0); }}
          className={`${inp} w-64`}
        />
        <select value={event} onChange={e => { setEvent(e.target.value); setPage(0); }} className={sel}>
          <option value="">All Events</option>
          <option value="go_kart">Go-Kart Racing</option>
          <option value="formula_green">Formula Green Racing</option>
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(0); }} className={sel}>
          <option value="">All Statuses</option>
          {["submitted","payment_done","under_review","approved","rejected","waitlisted"].map(s => (
            <option key={s} value={s}>{s.replace("_"," ")}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950">
              <tr>
                {["Reg ID","Team Name","Institution","Location","Event","Status","Members","Payment","Docs","Date"].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading && (
                <tr><td colSpan={10} className="text-center py-8 text-gray-500">Loading…</td></tr>
              )}
              {!loading && teams.length === 0 && (
                <tr><td colSpan={10} className="text-center py-8 text-gray-500">No teams found</td></tr>
              )}
              {teams.map(t => (
                <tr key={t.id} className="hover:bg-zinc-800/40 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/teams/${t.id}`)}>
                  <td className="px-4 py-3 font-mono text-xs text-green-400 whitespace-nowrap">{t.registration_id}</td>
                  <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{t.team_name}</td>
                  <td className="px-4 py-3 text-gray-400 max-w-[160px] truncate">{t.institution}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{t.city}, {t.state}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{EVENT_LABELS[t.event_slug] ?? t.event_slug}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize whitespace-nowrap ${STATUS_COLORS[t.status] ?? "text-gray-400 bg-zinc-800 border-zinc-700"}`}>
                      {t.status.replace("_"," ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">{t.member_count}</td>
                  <td className="px-4 py-3">
                    {t.payment_status === "paid"
                      ? <span className="text-xs text-green-400">Paid</span>
                      : <span className="text-xs text-gray-500">Pending</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {t.docs_approved}/{t.docs_uploaded}
                    <span className="text-gray-600 text-xs"> /4</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString("en-IN") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > PER_PAGE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 text-sm">
            <span className="text-gray-500">
              Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-zinc-800 rounded disabled:opacity-40 hover:bg-zinc-700 transition-colors">
                Prev
              </button>
              <button disabled={(page + 1) * PER_PAGE >= total} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-zinc-800 rounded disabled:opacity-40 hover:bg-zinc-700 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeamsPage() {
  return (
    <Suspense fallback={<p className="text-gray-400">Loading…</p>}>
      <TeamsContent />
    </Suspense>
  );
}
