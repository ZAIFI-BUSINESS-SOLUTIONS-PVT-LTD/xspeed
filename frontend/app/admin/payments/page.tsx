"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Suspense } from "react";
import api from "@/lib/api";

interface Payment {
  id: number;
  team_id: number;
  team_name: string;
  registration_id: string;
  event_slug: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount_paise: number;
  amount_inr: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  paid:    "bg-green-400/10 text-green-400 border-green-400/20",
  created: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  failed:  "bg-red-400/10   text-red-400   border-red-400/20",
};

const EVENT_LABELS: Record<string, string> = {
  go_kart: "Go-Kart", formula_green: "Formula Green",
};

function PaymentsContent() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const PER_PAGE = 20;

  const fetchPayments = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ status: statusFilter, skip: String(page * PER_PAGE), limit: String(PER_PAGE) });
    api.get(`/api/admin/payments?${params}`)
      .then(res => { setPayments(res.data.payments); setTotal(res.data.total); })
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const totalCollected = payments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + p.amount_inr, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-gray-500 text-sm mt-1">{total} payment record{total !== 1 ? "s" : ""}</p>
        </div>
        {totalCollected > 0 && (
          <div className="bg-green-900/20 border border-green-700/30 rounded-xl px-4 py-3 text-right">
            <p className="text-xs text-gray-500">Collected (this view)</p>
            <p className="text-xl font-bold text-green-400">₹{totalCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </div>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2">
        {["", "paid", "created", "failed"].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }}
            className={`px-3 py-1.5 rounded text-xs capitalize transition-colors ${
              statusFilter === s ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-400 hover:text-white"
            }`}
          >
            {s === "" ? "All" : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950">
              <tr>
                {["Team","Reg ID","Event","Amount","Status","Order ID","Payment ID","Created","Paid On"].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-500">Loading…</td></tr>
              )}
              {!loading && payments.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-500">No payments found</td></tr>
              )}
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/teams/${p.team_id}`}
                      className="text-white hover:text-red-400 transition-colors font-medium whitespace-nowrap">
                      {p.team_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-green-400 whitespace-nowrap">{p.registration_id}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{EVENT_LABELS[p.event_slug] ?? p.event_slug}</td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">₹{p.amount_inr.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[p.status] ?? "text-gray-400 bg-zinc-800 border-zinc-700"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[140px] truncate">{p.razorpay_order_id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[140px] truncate">{p.razorpay_payment_id ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-IN") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > PER_PAGE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 text-sm">
            <span className="text-gray-500">Showing {page*PER_PAGE+1}–{Math.min((page+1)*PER_PAGE,total)} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page===0} onClick={()=>setPage(p=>p-1)}
                className="px-3 py-1 bg-zinc-800 rounded disabled:opacity-40 hover:bg-zinc-700">Prev</button>
              <button disabled={(page+1)*PER_PAGE>=total} onClick={()=>setPage(p=>p+1)}
                className="px-3 py-1 bg-zinc-800 rounded disabled:opacity-40 hover:bg-zinc-700">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<p className="text-gray-400">Loading…</p>}>
      <PaymentsContent />
    </Suspense>
  );
}
