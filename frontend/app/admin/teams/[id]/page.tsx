"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";

interface Leader { id: number; full_name: string; email: string; phone: string }
interface Member { id: number; name: string; email: string; phone: string | null; date_of_birth: string | null }
interface Doc {
  id: number; doc_type: string; label: string; original_filename: string;
  file_size: number; status: string; reviewer_note: string | null; uploaded_at: string;
}
interface Payment {
  id: number; razorpay_order_id: string; razorpay_payment_id: string | null;
  amount_paise: number; amount_inr: number; status: string; paid_at: string | null;
}
interface TeamDetail {
  id: number; registration_id: string; team_name: string; institution: string;
  city: string; state: string; event_slug: string; event_name: string;
  status: string; created_at: string;
  leader: Leader; members: Member[]; documents: Doc[]; payment: Payment | null;
}

const STATUS_COLORS: Record<string, string> = {
  submitted:    "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  payment_done: "bg-blue-400/10   text-blue-400   border-blue-400/20",
  under_review: "bg-purple-400/10 text-purple-400 border-purple-400/20",
  approved:     "bg-green-400/10  text-green-400  border-green-400/20",
  rejected:     "bg-red-400/10    text-red-400    border-red-400/20",
  waitlisted:   "bg-orange-400/10 text-orange-400 border-orange-400/20",
};
const DOC_STATUS: Record<string, string> = {
  pending:            "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  approved:           "bg-green-400/10  text-green-400  border-green-400/20",
  rejected:           "bg-red-400/10    text-red-400    border-red-400/20",
  reupload_requested: "bg-orange-400/10 text-orange-400 border-orange-400/20",
};

const ALLOWED_STATUSES = ["under_review","approved","rejected","waitlisted","cancelled"];

function formatBytes(b: number) {
  if (b < 1024*1024) return `${(b/1024).toFixed(0)} KB`;
  return `${(b/(1024*1024)).toFixed(1)} MB`;
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Status update form
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Send message state
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody,    setMsgBody]    = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Document review state
  const [reviewingDocId,  setReviewingDocId]  = useState<number | null>(null);
  const [reviewDocAction, setReviewDocAction] = useState<"approved"|"rejected"|"reupload_requested">("approved");
  const [reviewDocNote,   setReviewDocNote]   = useState("");
  const [savingDoc, setSavingDoc] = useState(false);

  function fetchTeam() {
    api.get(`/api/admin/teams/${teamId}`)
      .then(res => { setTeam(res.data); setNewStatus(res.data.status); })
      .catch(() => { toast.error("Team not found"); router.replace("/admin/teams"); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchTeam(); }, [teamId]);

  async function handleStatusUpdate() {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      await api.put(`/api/admin/teams/${teamId}/status`, { status: newStatus, note: statusNote || null });
      toast.success(`Status updated to ${newStatus}`);
      setStatusNote("");
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Update failed");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleSendMessage() {
    if (!msgSubject.trim() || !msgBody.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    setSendingMsg(true);
    try {
      await api.post(`/api/admin/teams/${teamId}/message`, {
        subject: msgSubject,
        message: msgBody,
      });
      toast.success("Message sent to team leader");
      setMsgSubject("");
      setMsgBody("");
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Failed to send message");
    } finally {
      setSendingMsg(false);
    }
  }

  async function handleDocReview(docId: number) {
    setSavingDoc(true);
    try {
      await api.put(`/api/admin/documents/${docId}/review`, {
        status: reviewDocAction,
        reviewer_note: reviewDocNote || null,
      });
      toast.success(`Document ${reviewDocAction.replace("_", " ")}`);
      setReviewingDocId(null);
      setReviewDocNote("");
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Review failed");
    } finally {
      setSavingDoc(false);
    }
  }

  async function handleDocDownload(docId: number, filename: string) {
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:8000/api/admin/documents/${docId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Download failed"); }
  }

  const sectionCls = "bg-zinc-900 border border-zinc-800 rounded-xl p-6";
  const labelCls   = "text-xs text-gray-500 mb-1";
  const valueCls   = "text-sm text-white";
  const selCls     = "bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-red-600 w-full";

  if (loading) return <p className="text-gray-400">Loading…</p>;
  if (!team)   return null;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/teams" className="text-gray-500 hover:text-white text-sm">← All Teams</Link>
          <h1 className="text-2xl font-bold mt-2">{team.team_name}</h1>
          <p className="text-gray-500 text-sm mt-0.5 font-mono">{team.registration_id}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full border capitalize ${STATUS_COLORS[team.status] ?? "text-gray-400 bg-zinc-800 border-zinc-700"}`}>
          {team.status.replace("_", " ")}
        </span>
      </div>

      {/* Team info + Leader */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold mb-4">Team Details</h2>
          <div className="space-y-3">
            {[
              ["Event",       team.event_name],
              ["Institution", team.institution],
              ["City",        team.city],
              ["State",       team.state],
              ["Registered",  team.created_at ? new Date(team.created_at).toLocaleString("en-IN") : "—"],
            ].map(([l, v]) => (
              <div key={l}>
                <p className={labelCls}>{l}</p>
                <p className={valueCls}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={sectionCls}>
          <h2 className="text-sm font-semibold mb-4">Team Leader</h2>
          <div className="space-y-3">
            {[
              ["Name",  team.leader.full_name],
              ["Email", team.leader.email],
              ["Phone", team.leader.phone || "—"],
            ].map(([l, v]) => (
              <div key={l}>
                <p className={labelCls}>{l}</p>
                <p className={valueCls}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Members */}
      <div className={sectionCls}>
        <h2 className="text-sm font-semibold mb-4">Team Members ({team.members.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800">
              <tr>
                {["#","Name","Email","Phone","Date of Birth"].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 pb-2 pr-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {team.members.map((m, i) => (
                <tr key={m.id}>
                  <td className="py-2 pr-4 text-gray-500 text-xs">{i + 1}</td>
                  <td className="py-2 pr-4 text-white">{m.name}</td>
                  <td className="py-2 pr-4 text-gray-400">{m.email}</td>
                  <td className="py-2 pr-4 text-gray-400">{m.phone ?? "—"}</td>
                  <td className="py-2 text-gray-400">{m.date_of_birth ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status control */}
      <div className={sectionCls}>
        <h2 className="text-sm font-semibold mb-4">Update Registration Status</h2>
        <div className="space-y-3">
          <div>
            <p className={labelCls}>New Status</p>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className={selCls}>
              {ALLOWED_STATUSES.map(s => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <p className={labelCls}>Note (optional — visible to team)</p>
            <textarea
              value={statusNote}
              onChange={e => setStatusNote(e.target.value)}
              placeholder="Add a note for the team…"
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-white outline-none focus:border-red-600 resize-none"
            />
          </div>
          <button
            onClick={handleStatusUpdate}
            disabled={updatingStatus || newStatus === team.status}
            className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 disabled:cursor-not-allowed px-6 py-2 rounded text-sm font-semibold transition-colors"
          >
            {updatingStatus ? "Saving…" : newStatus === team.status ? "No change" : `Update to "${newStatus.replace("_"," ")}"`}
          </button>
        </div>
      </div>

      {/* Send Message */}
      <div className={sectionCls}>
        <h2 className="text-sm font-semibold mb-1">Send Message to Team</h2>
        <p className="text-xs text-gray-500 mb-4">
          An email will be sent to <span className="text-white">{team.leader.email}</span>
        </p>
        <div className="space-y-3">
          <div>
            <p className={labelCls}>Subject</p>
            <input
              type="text"
              value={msgSubject}
              onChange={e => setMsgSubject(e.target.value)}
              placeholder="e.g. Document clarification required"
              className={selCls}
            />
          </div>
          <div>
            <p className={labelCls}>Message</p>
            <textarea
              value={msgBody}
              onChange={e => setMsgBody(e.target.value)}
              placeholder="Type your message here…"
              rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-white outline-none focus:border-red-600 resize-none"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={sendingMsg || !msgSubject.trim() || !msgBody.trim()}
            className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 disabled:cursor-not-allowed px-6 py-2 rounded text-sm font-semibold transition-colors"
          >
            {sendingMsg ? "Sending…" : "Send Message"}
          </button>
        </div>
      </div>

      {/* Documents */}
      <div className={sectionCls}>
        <h2 className="text-sm font-semibold mb-4">Documents ({team.documents.length})</h2>
        {team.documents.length === 0 ? (
          <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {team.documents.map(doc => (
              <div key={doc.id} className="border border-zinc-700 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-medium text-white">{doc.label}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${DOC_STATUS[doc.status] ?? "text-gray-400 bg-zinc-800 border-zinc-700"}`}>
                        {doc.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {doc.original_filename} · {formatBytes(doc.file_size)} ·{" "}
                      {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString("en-IN") : ""}
                    </p>
                    {doc.reviewer_note && (
                      <p className="text-xs text-orange-300 mt-1">Note: {doc.reviewer_note}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleDocDownload(doc.id, doc.original_filename)}
                      className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded transition-colors">
                      Download
                    </button>
                    <button
                      onClick={() => {
                        setReviewingDocId(reviewingDocId === doc.id ? null : doc.id);
                        setReviewDocAction("approved"); setReviewDocNote("");
                      }}
                      className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition-colors"
                    >
                      {reviewingDocId === doc.id ? "Cancel" : "Review"}
                    </button>
                  </div>
                </div>

                {reviewingDocId === doc.id && (
                  <div className="mt-3 border-t border-zinc-700 pt-3 space-y-3">
                    <div className="flex gap-2">
                      {(["approved","rejected","reupload_requested"] as const).map(a => (
                        <button key={a} onClick={() => setReviewDocAction(a)}
                          className={`text-xs px-3 py-1.5 rounded capitalize transition-colors ${
                            reviewDocAction === a
                              ? a === "approved" ? "bg-green-600" : a === "rejected" ? "bg-red-600" : "bg-orange-600"
                              : "bg-zinc-700 hover:bg-zinc-600"
                          }`}
                        >{a.replace("_"," ")}</button>
                      ))}
                    </div>
                    {(reviewDocAction === "rejected" || reviewDocAction === "reupload_requested") && (
                      <textarea
                        value={reviewDocNote} onChange={e => setReviewDocNote(e.target.value)}
                        placeholder="Note for the team (required)…" rows={2}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-white outline-none focus:border-red-600 resize-none"
                      />
                    )}
                    <button
                      onClick={() => handleDocReview(doc.id)}
                      disabled={savingDoc || ((reviewDocAction === "rejected" || reviewDocAction === "reupload_requested") && !reviewDocNote.trim())}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 disabled:cursor-not-allowed px-4 py-1.5 rounded text-sm transition-colors"
                    >
                      {savingDoc ? "Saving…" : "Confirm"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment */}
      <div className={sectionCls}>
        <h2 className="text-sm font-semibold mb-4">Payment</h2>
        {!team.payment ? (
          <p className="text-gray-500 text-sm">No payment record found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              ["Amount",     `₹${team.payment.amount_inr.toFixed(2)}`],
              ["Status",     team.payment.status],
              ["Order ID",   team.payment.razorpay_order_id || "—"],
              ["Payment ID", team.payment.razorpay_payment_id || "—"],
              ["Paid On",    team.payment.paid_at ? new Date(team.payment.paid_at).toLocaleDateString("en-IN") : "—"],
            ].map(([l, v]) => (
              <div key={l}>
                <p className={labelCls}>{l}</p>
                <p className="text-sm text-white font-mono break-all">{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
