"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";

interface Doc {
  id: number;
  team_id: number;
  team_name: string;
  registration_id: string;
  event_slug: string;
  doc_type: string;
  label: string;
  original_filename: string;
  file_size: number;
  status: string;
  reviewer_note: string | null;
  uploaded_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:            "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  approved:           "bg-green-400/10  text-green-400  border-green-400/20",
  rejected:           "bg-red-400/10    text-red-400    border-red-400/20",
  reupload_requested: "bg-orange-400/10 text-orange-400 border-orange-400/20",
};

function formatBytes(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentsContent() {
  const searchParams = useSearchParams();

  const [docs, setDocs]   = useState<Doc[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [page, setPage] = useState(0);

  const [reviewingId,   setReviewingId]   = useState<number | null>(null);
  const [reviewAction,  setReviewAction]  = useState<"approved" | "rejected" | "reupload_requested">("approved");
  const [reviewNote,    setReviewNote]    = useState("");
  const [saving, setSaving] = useState(false);

  const PER_PAGE = 20;

  const fetchDocs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ status: statusFilter, skip: String(page * PER_PAGE), limit: String(PER_PAGE) });
    api.get(`/api/admin/documents?${params}`)
      .then(res => { setDocs(res.data.documents); setTotal(res.data.total); })
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  async function handleReview(docId: number) {
    setSaving(true);
    try {
      await api.put(`/api/admin/documents/${docId}/review`, {
        status: reviewAction,
        reviewer_note: reviewNote || null,
      });
      toast.success(`Document ${reviewAction.replace("_", " ")}`);
      setReviewingId(null);
      setReviewNote("");
      fetchDocs();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Action failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload(docId: number, filename: string) {
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:8000/api/admin/documents/${docId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  }

  const TABS = ["", "pending", "approved", "rejected", "reupload_requested"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Document Review</h1>
        <p className="text-gray-500 text-sm mt-1">{total} document{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }}
            className={`px-3 py-1.5 rounded text-xs capitalize transition-colors ${
              statusFilter === s
                ? "bg-red-600 text-white"
                : "bg-zinc-800 text-gray-400 hover:text-white"
            }`}
          >
            {s === "" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading && <p className="text-gray-400 text-sm">Loading…</p>}
        {!loading && docs.length === 0 && <p className="text-gray-500 text-sm">No documents found.</p>}

        {docs.map(doc => (
          <div key={doc.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Link href={`/admin/teams/${doc.team_id}`}
                    className="font-semibold text-white hover:text-red-400 transition-colors">
                    {doc.team_name}
                  </Link>
                  <span className="text-xs text-gray-600 font-mono">{doc.registration_id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[doc.status] ?? "text-gray-400 bg-zinc-800 border-zinc-700"}`}>
                    {doc.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-300">{doc.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {doc.original_filename} · {formatBytes(doc.file_size)} ·{" "}
                  {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString("en-IN") : ""}
                </p>
                {doc.reviewer_note && (
                  <p className="text-xs text-orange-300 mt-1">Note: {doc.reviewer_note}</p>
                )}
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleDownload(doc.id, doc.original_filename)}
                  className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded transition-colors">
                  Download
                </button>
                {doc.status !== "approved" && (
                  <button
                    onClick={() => {
                      setReviewingId(doc.id === reviewingId ? null : doc.id);
                      setReviewAction("approved");
                      setReviewNote("");
                    }}
                    className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition-colors"
                  >
                    Review
                  </button>
                )}
              </div>
            </div>

            {/* Inline review form */}
            {reviewingId === doc.id && (
              <div className="mt-4 border-t border-zinc-800 pt-4 space-y-3">
                <div className="flex gap-2">
                  {(["approved", "rejected", "reupload_requested"] as const).map(a => (
                    <button key={a} onClick={() => setReviewAction(a)}
                      className={`text-xs px-3 py-1.5 rounded capitalize transition-colors ${
                        reviewAction === a
                          ? a === "approved" ? "bg-green-600" : a === "rejected" ? "bg-red-600" : "bg-orange-600"
                          : "bg-zinc-700 hover:bg-zinc-600"
                      }`}
                    >
                      {a.replace("_", " ")}
                    </button>
                  ))}
                </div>
                {(reviewAction === "rejected" || reviewAction === "reupload_requested") && (
                  <textarea
                    value={reviewNote}
                    onChange={e => setReviewNote(e.target.value)}
                    placeholder="Add a note for the team (required for rejection)…"
                    rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-white outline-none focus:border-red-600 resize-none"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview(doc.id)}
                    disabled={saving || ((reviewAction === "rejected" || reviewAction === "reupload_requested") && !reviewNote.trim())}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 disabled:cursor-not-allowed px-4 py-1.5 rounded text-sm transition-colors"
                  >
                    {saving ? "Saving…" : "Confirm"}
                  </button>
                  <button onClick={() => setReviewingId(null)}
                    className="text-gray-400 hover:text-white text-sm transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {total > PER_PAGE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Showing {page * PER_PAGE + 1}–{Math.min((page+1)*PER_PAGE, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p-1)}
              className="px-3 py-1 bg-zinc-800 rounded disabled:opacity-40 hover:bg-zinc-700">Prev</button>
            <button disabled={(page+1)*PER_PAGE >= total} onClick={() => setPage(p => p+1)}
              className="px-3 py-1 bg-zinc-800 rounded disabled:opacity-40 hover:bg-zinc-700">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<p className="text-gray-400">Loading…</p>}>
      <DocumentsContent />
    </Suspense>
  );
}
