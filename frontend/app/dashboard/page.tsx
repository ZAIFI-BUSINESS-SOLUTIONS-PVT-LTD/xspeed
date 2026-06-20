"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";

import api from "@/lib/api";
import { isAuthenticated, getUser } from "@/lib/auth";
import { AnimatedCar } from "@/components/RacingCar";
import { HaikeiWave, HaikeiBlobs, CheckeredStrip } from "@/components/HaikeiBackground";
import { SuccessCheckmark, PulseDot, RacingLoader } from "@/components/AnimatedIcons";
import { RacingImageBackground } from "@/components/RacingImageBackground";

interface Team {
  id: number;
  registration_id: string;
  event_slug: string;
  team_name: string;
  institution: string;
  city: string;
  state: string;
  status: string;
  created_at: string;
  members: { id: number; name: string; email: string; phone?: string }[];
}

interface Doc {
  id: number;
  doc_type: string;
  original_filename: string;
  status: string;
  reviewer_note?: string;
}

interface Payment {
  id: number;
  status: string;
  amount_paise: number;
  paid_at?: string;
}

interface EventInfo {
  display_name: string;
  event_date?: string;
  venue?: string;
  registration_fee: number;
  per_member_fee: number;
  gst_percentage: number;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  notif_type: string;
  is_read: boolean;
  created_at: string;
}

const DOC_LABELS: Record<string, string> = {
  noc: "No Objection Certificate",
  college_id: "College ID Card",
  govt_id: "Government ID",
  driving_license: "Driving License",
};

const REQUIRED_DOCS = ["noc", "college_id", "govt_id", "driving_license"];

const statusColor: Record<string, string> = {
  submitted:    "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  payment_done: "text-blue-400   bg-blue-400/10   border-blue-400/20",
  approved:     "text-green-400  bg-green-400/10  border-green-400/20",
  rejected:     "text-red-400    bg-red-400/10    border-red-400/20",
  pending:      "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  paid:         "text-green-400  bg-green-400/10  border-green-400/20",
  created:      "text-gray-400   bg-gray-400/10   border-gray-400/20",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function notifIcon(type: string, title: string): string {
  if (type === "document") {
    const l = title.toLowerCase();
    if (l.includes("approved"))  return "✅";
    if (l.includes("rejected"))  return "❌";
    if (l.includes("re-upload")) return "⚠️";
    return "📄";
  }
  if (type === "status_update") {
    const l = title.toLowerCase();
    if (l.includes("approved"))  return "🏆";
    if (l.includes("rejected"))  return "❌";
    if (l.includes("waitlist"))  return "⏳";
    return "🔄";
  }
  return "📩";
}

const FU = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

const STAGGER = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventSlug = searchParams.get("event") ?? "";
  const user = getUser();
  const regIdRef = useRef<HTMLParagraphElement>(null);

  const [team,    setTeam]    = useState<Team | null>(null);
  const [docs,    setDocs]    = useState<Doc[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [event,   setEvent]   = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAllNotifs, setShowAllNotifs] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const refreshNotifs = useCallback(async () => {
    try {
      const res = await api.get("/api/notifications");
      setNotifications(res.data);
    } catch {}
  }, []);

  const markRead = useCallback(async (id: number) => {
    await api.put(`/api/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }, []);

  const markAllRead = useCallback(async () => {
    await api.put("/api/notifications/read-all");
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    const params = eventSlug ? `?event_slug=${eventSlug}` : "";
    const eventPath = eventSlug ? `/api/events/${eventSlug}` : null;

    Promise.all([
      api.get(`/api/teams/mine${params}`),
      api.get(`/api/documents/mine${params}`).catch(() => ({ data: [] })),
      api.get(`/api/payments/mine${params}`).catch(() => ({ data: null })),
      eventPath ? api.get(eventPath).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
      api.get("/api/notifications").catch(() => ({ data: [] })),
    ])
      .then(([teamRes, docsRes, paymentRes, eventRes, notifsRes]) => {
        setTeam(teamRes.data);
        setDocs(docsRes.data);
        setPayment(paymentRes.data);
        setEvent(eventRes.data);
        setNotifications(notifsRes.data);
      })
      .catch(() => {
        toast.error("Could not load dashboard. Please try again.");
        router.replace("/event-selection");
      })
      .finally(() => setLoading(false));
  }, [eventSlug, router]);

  // GSAP: Registration ID glow reveal
  useEffect(() => {
    if (team && regIdRef.current) {
      gsap.fromTo(
        regIdRef.current,
        { opacity: 0, letterSpacing: "0.5em", filter: "blur(6px)" },
        { opacity: 1, letterSpacing: "0.02em", filter: "blur(0px)", duration: 1, ease: "power3.out", delay: 0.6 }
      );
    }
  }, [team]);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px] pointer-events-none" />
        <AnimatedCar type="formula" dir="ltr" size={480} opacity={0.04} duration={26} top="65%" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <RacingLoader size={48} />
          <p className="text-gray-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!team) return null;

  const uploadedTypes   = new Set(docs.map((d) => d.doc_type));
  const uploadedCount   = REQUIRED_DOCS.filter((t) => uploadedTypes.has(t)).length;
  const allDocsUploaded = uploadedCount === REQUIRED_DOCS.length;
  const isPaid          = payment?.status === "paid";
  const hasRejected     = docs.some((d) => d.status === "rejected");
  const q               = eventSlug ? `?event=${eventSlug}` : "";
  const isApproved      = team.status === "approved";

  const alerts: { msg: string; href: string; cta: string }[] = [];
  if (!allDocsUploaded)
    alerts.push({ msg: `${REQUIRED_DOCS.length - uploadedCount} document(s) not uploaded yet`, href: `/dashboard/documents${q}`, cta: "Upload Now" });
  if (hasRejected)
    alerts.push({ msg: "One or more documents were rejected — re-upload required", href: `/dashboard/documents${q}`, cta: "Re-upload" });
  if (!isPaid)
    alerts.push({ msg: "Registration fee payment not completed", href: `/dashboard/payment${q}`, cta: "Pay Now" });

  const visibleNotifs = showAllNotifs ? notifications : notifications.slice(0, 5);

  const NAV_ITEMS = [
    { href: `/dashboard/timeline${q}`,  icon: "📋", label: "Timeline"  },
    { href: `/dashboard/documents${q}`, icon: "📄", label: "Documents" },
    { href: `/dashboard/payment${q}`,   icon: "💳", label: "Payment"   },
    { href: `/dashboard/profile${q}`,   icon: "👥", label: "Profile"   },
  ];

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden pb-16">

      {/* Backgrounds */}
      <RacingImageBackground src="/images/racing/f1-race-6.jpg" opacity={0.15} gradient="dark" />
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px] pointer-events-none" />
      <HaikeiBlobs opacity={0.8} />
      <HaikeiWave opacity={0.7} />
      <AnimatedCar type="kart" dir="ltr" size={440} opacity={0.038} duration={30} delay={10} bottom="6%" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-10 space-y-6">

        {/* ── Header ── */}
        <motion.div
          variants={STAGGER}
          initial="hidden"
          animate="show"
          className="flex items-start justify-between"
        >
          <motion.div variants={FU}>
            <p className="text-gray-500 text-sm">Welcome back, <span className="text-gray-300">{user?.full_name}</span></p>
            <h1 className="text-3xl font-black mt-1 tracking-tight">Team Dashboard</h1>
          </motion.div>
          <motion.div variants={FU}>
            <Link
              href={`/dashboard/timeline${q}`}
              className="text-xs bg-zinc-900 hover:bg-zinc-800 px-3 py-2 rounded-lg border border-white/8 hover:border-white/15 transition-all"
            >
              View Timeline →
            </Link>
          </motion.div>
        </motion.div>

        {/* Approved celebration banner */}
        <AnimatePresence>
          {isApproved && (
            <motion.div
              key="approved"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
              className="flex items-center gap-4 bg-green-900/20 border border-green-600/50 rounded-2xl px-5 py-4 shadow-lg shadow-green-900/10"
            >
              <SuccessCheckmark size={52} />
              <div>
                <p className="text-green-400 font-bold text-base">Registration Approved!</p>
                <p className="text-green-300/70 text-sm mt-0.5">See you at the event — your team is confirmed.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending alerts */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {alerts.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 + 0.2 }}
                  className="flex items-center justify-between bg-yellow-900/12 border border-yellow-700/30 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <PulseDot color="#ca8a04" />
                    <p className="text-sm text-yellow-300">{a.msg}</p>
                  </div>
                  <Link href={a.href} className="ml-4 text-xs bg-yellow-600 hover:bg-yellow-500 px-3 py-1.5 rounded flex-shrink-0 transition-colors">
                    {a.cta}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {alerts.length === 0 && !isApproved && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 bg-emerald-900/12 border border-emerald-700/30 rounded-xl px-4 py-3"
          >
            <span className="text-emerald-400">✓</span>
            <p className="text-sm text-emerald-300">All steps complete — your registration is under admin review.</p>
          </motion.div>
        )}

        {/* ── Notifications Panel ── */}
        <AnimatePresence>
          {notifications.length > 0 && (
            <motion.div
              key="notifs"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-zinc-900/80 backdrop-blur border border-white/6 rounded-2xl overflow-hidden shadow-xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-semibold">Messages from Admin</span>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center"
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-gray-500 hover:text-white transition-colors">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-white/4">
                <AnimatePresence>
                  {visibleNotifs.map((n, idx) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`px-5 py-4 transition-colors ${!n.is_read ? "bg-zinc-800/30" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">{notifIcon(n.notif_type, n.title)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-semibold ${!n.is_read ? "text-white" : "text-gray-300"}`}>
                              {n.title}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-600 whitespace-nowrap">{n.created_at ? timeAgo(n.created_at) : ""}</span>
                              {!n.is_read && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed whitespace-pre-line">{n.message}</p>
                          {!n.is_read && (
                            <button onClick={() => markRead(n.id)} className="text-xs text-gray-600 hover:text-gray-300 mt-2 transition-colors">
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {notifications.length > 5 && (
                <div className="px-5 py-3 border-t border-white/5 text-center">
                  <button onClick={() => setShowAllNotifs(v => !v)} className="text-xs text-gray-500 hover:text-white transition-colors">
                    {showAllNotifs ? "Show less" : `Show ${notifications.length - 5} more`}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Registration Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          data-aos="fade-up"
          className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 border border-white/6 shadow-xl overflow-hidden relative"
        >
          {/* Subtle accent line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />

          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Registration ID</p>
              <p
                ref={regIdRef}
                className="font-mono text-2xl font-bold text-green-400 tracking-wide"
              >
                {team.registration_id}
              </p>
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full border capitalize ${statusColor[team.status] ?? "text-gray-400 bg-gray-400/10 border-gray-400/20"}`}>
              {team.status === "approved" && <span className="mr-1">✓</span>}
              {team.status.replace("_", " ")}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Team",        value: team.team_name },
              { label: "Event",       value: event?.display_name ?? team.event_slug.replace("_", " ") },
              { label: "Institution", value: team.institution },
              { label: "Location",    value: `${team.city}, ${team.state}` },
              ...(event?.event_date ? [{ label: "Event Date", value: event.event_date }] : []),
              ...(event?.venue       ? [{ label: "Venue",      value: event.venue       }] : []),
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-gray-500 text-xs mb-0.5">{label}</p>
                <p className="text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-white/5 pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-2">Team Members ({team.members.length})</p>
              <div className="space-y-1.5">
                {team.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    <span>{m.name}</span>
                    <span className="text-gray-500 text-xs hidden sm:inline">{m.email}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link href={`/dashboard/profile${q}`} className="text-xs text-gray-500 hover:text-white transition-colors flex-shrink-0 ml-4">
              Edit Profile →
            </Link>
          </div>
        </motion.div>

        {/* ── Documents + Payment row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Documents */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            data-aos="fade-right"
            className="bg-zinc-900/80 backdrop-blur rounded-2xl p-5 border border-white/6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold">Documents</h2>
                <p className="text-xs text-gray-500 mt-0.5">{uploadedCount}/{REQUIRED_DOCS.length} uploaded</p>
              </div>
              <Link href={`/dashboard/documents${q}`} className="text-xs bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded transition-colors">
                {allDocsUploaded && !hasRejected ? "View" : "Upload"}
              </Link>
            </div>

            <div className="space-y-1.5">
              {REQUIRED_DOCS.map((type) => {
                const doc = docs.find((d) => d.doc_type === type);
                return (
                  <div key={type} className="flex items-center justify-between py-1 border-b border-white/4 last:border-0">
                    <span className="text-xs text-gray-400">{DOC_LABELS[type]}</span>
                    {doc ? (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full border capitalize ${statusColor[doc.status] ?? "text-gray-400 bg-gray-400/10 border-gray-400/20"}`}>
                        {doc.status}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600">Not uploaded</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-red-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(uploadedCount / REQUIRED_DOCS.length) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
              />
            </div>
          </motion.div>

          {/* Payment */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            data-aos="fade-left"
            className="bg-zinc-900/80 backdrop-blur rounded-2xl p-5 border border-white/6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold">Payment</h2>
                <p className="text-xs text-gray-500 mt-0.5">Registration fee</p>
              </div>
              {isPaid ? (
                <span className={`text-xs px-2 py-1 rounded-full border ${statusColor["paid"]}`}>Paid ✓</span>
              ) : (
                <Link href={`/dashboard/payment${q}`} className="text-xs bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded transition-colors">
                  Pay Now
                </Link>
              )}
            </div>

            {payment ? (
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Amount</span>
                  <span className="font-mono text-emerald-400">₹{(payment.amount_paise / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Status</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${statusColor[payment.status] ?? "text-gray-400 bg-gray-400/10 border-gray-400/20"}`}>
                    {payment.status}
                  </span>
                </div>
                {payment.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Paid on</span>
                    <span className="text-xs">{new Date(payment.paid_at).toLocaleDateString("en-IN")}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 space-y-2">
                <p>No payment initiated yet.</p>
                {event && (
                  <p className="text-xs text-gray-600">
                    Fee: ₹{event.registration_fee} base + ₹{event.per_member_fee}/member + {event.gst_percentage}% GST
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Quick Nav ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          data-aos="fade-up"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {NAV_ITEMS.map(({ href, icon, label }) => (
            <motion.div key={href} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={href}
                className="group flex flex-col items-center bg-zinc-900/80 backdrop-blur border border-white/6 hover:border-red-600/30 rounded-xl py-4 text-center transition-all duration-200 hover:bg-zinc-800/80 hover:shadow-lg hover:shadow-red-900/10"
              >
                <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform duration-200 block">{icon}</span>
                <span className="text-xs text-gray-400 group-hover:text-white transition-colors">{label}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex gap-4 text-xs text-gray-600"
        >
          <Link href="/event-selection" className="hover:text-white transition-colors">Event Selection</Link>
          <Link href="/teams"           className="hover:text-white transition-colors">All Teams →</Link>
          <Link href="/estimate"        className="hover:text-white transition-colors">Fee Estimator →</Link>
        </motion.div>

      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px]" />
          <RacingLoader size={48} />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
