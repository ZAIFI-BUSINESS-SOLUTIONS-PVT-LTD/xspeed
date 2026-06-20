"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";

import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { HaikeiDots, CheckeredStrip } from "@/components/HaikeiBackground";
import { PulseDot, RacingLoader } from "@/components/AnimatedIcons";
import { RacingImageBackground } from "@/components/RacingImageBackground";

interface Team {
  registration_id: string;
  event_slug: string;
  team_name: string;
  status: string;
  created_at: string;
  members: { id: number; name: string }[];
}

interface Doc   { doc_type: string; status: string; }
interface Payment { status: string; paid_at?: string; }
interface EventInfo { display_name: string; event_date?: string; venue?: string; }

const REQUIRED_DOCS = ["noc", "college_id", "govt_id", "driving_license"];

type StageStatus = "done" | "active" | "upcoming";

interface Stage {
  id: number;
  label: string;
  description: string;
  status: StageStatus;
  date?: string;
  note?: string;
  actionHref?: string;
  actionLabel?: string;
}

function daysUntil(dateStr: string): number | null {
  try {
    const d    = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  } catch { return null; }
}

const stageTheme: Record<StageStatus, {
  circle: string; circleBg: string; line: string; label: string;
}> = {
  done:    { circle: "border-green-500",  circleBg: "bg-green-500",  line: "bg-green-500",  label: "text-white"   },
  active:  { circle: "border-red-500",    circleBg: "bg-red-600",    line: "bg-zinc-700",   label: "text-white"   },
  upcoming:{ circle: "border-zinc-700",   circleBg: "bg-zinc-800",   line: "bg-zinc-800",   label: "text-gray-500" },
};

function TimelineContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const eventSlug    = searchParams.get("event") ?? "";
  const containerRef = useRef<HTMLDivElement>(null);

  const [team,    setTeam]    = useState<Team | null>(null);
  const [docs,    setDocs]    = useState<Doc[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [event,   setEvent]   = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/login"); return; }
    const params    = eventSlug ? `?event_slug=${eventSlug}` : "";
    const eventPath = eventSlug ? `/api/events/${eventSlug}` : null;
    Promise.all([
      api.get(`/api/teams/mine${params}`),
      api.get(`/api/documents/mine${params}`).catch(() => ({ data: [] })),
      api.get(`/api/payments/mine${params}`).catch(() => ({ data: null })),
      eventPath ? api.get(eventPath).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
    ])
      .then(([teamRes, docsRes, paymentRes, eventRes]) => {
        setTeam(teamRes.data);
        setDocs(docsRes.data);
        setPayment(paymentRes.data);
        setEvent(eventRes.data);
      })
      .catch(() => { toast.error("Could not load timeline data"); router.replace("/event-selection"); })
      .finally(() => setLoading(false));
  }, [eventSlug, router]);

  // GSAP: Stagger timeline stages in, then animate the connector lines
  useEffect(() => {
    if (!team) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".ts-stage",
        { opacity: 0, x: -24 },
        { opacity: 1, x: 0, stagger: 0.14, duration: 0.55, ease: "power2.out", delay: 0.2 }
      );
      gsap.fromTo(".ts-line",
        { scaleY: 0, transformOrigin: "top center" },
        { scaleY: 1, stagger: 0.14, duration: 0.45, ease: "power2.out", delay: 0.35 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [team]);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px]" />
        <RacingLoader size={48} />
      </div>
    );
  }

  if (!team) return null;

  const allDocsUploaded = REQUIRED_DOCS.every((t) => docs.some((d) => d.doc_type === t));
  const isPaid          = payment?.status === "paid";
  const isApproved      = team.status === "approved";
  const isRejected      = team.status === "rejected";
  const isUnderReview   = team.status === "payment_done" || (isPaid && allDocsUploaded && !isApproved && !isRejected);

  function stageStatus(i: number): StageStatus {
    switch (i) {
      case 0: return "done";
      case 1: return allDocsUploaded ? "done" : isApproved || isUnderReview ? "done" : "active";
      case 2: return isPaid ? "done" : allDocsUploaded ? "active" : "upcoming";
      case 3: return (isApproved || isRejected) ? "done" : isUnderReview ? "active" : "upcoming";
      case 4: return (isApproved || isRejected) ? "done" : "upcoming";
      default: return "upcoming";
    }
  }

  const dashLink   = `/dashboard${eventSlug ? `?event=${eventSlug}` : ""}`;
  const countdown  = event?.event_date ? daysUntil(event.event_date) : null;

  const stages: Stage[] = [
    {
      id: 0, status: stageStatus(0),
      label: "Team Registered",
      description: `Registration ID issued: ${team.registration_id}`,
      date: new Date(team.created_at).toLocaleDateString("en-IN"),
    },
    {
      id: 1, status: stageStatus(1),
      label: "Documents Uploaded",
      description: allDocsUploaded
        ? "All 4 required documents submitted"
        : `${docs.filter((d) => REQUIRED_DOCS.includes(d.doc_type)).length} of 4 uploaded`,
      note: !allDocsUploaded ? "Upload remaining documents to proceed" : undefined,
      actionHref: !allDocsUploaded ? `/dashboard/documents${eventSlug ? `?event=${eventSlug}` : ""}` : undefined,
      actionLabel: "Upload Documents",
    },
    {
      id: 2, status: stageStatus(2),
      label: "Payment Completed",
      description: isPaid
        ? `Fee paid${payment?.paid_at ? " on " + new Date(payment.paid_at).toLocaleDateString("en-IN") : ""}`
        : "Registration fee payment pending",
      note: !isPaid && allDocsUploaded ? "Proceed to payment to submit for review" : undefined,
      actionHref: !isPaid && allDocsUploaded ? `/dashboard/payment${eventSlug ? `?event=${eventSlug}` : ""}` : undefined,
      actionLabel: "Pay Now",
    },
    {
      id: 3, status: stageStatus(3),
      label: "Admin Review",
      description: isApproved ? "Registration approved by admin"
        : isRejected ? "Registration was not approved"
        : isUnderReview ? "Your registration is being reviewed by the admin team"
        : "Awaiting payment completion",
      note: isRejected ? "Please contact the event team for more information" : undefined,
    },
    {
      id: 4, status: stageStatus(4),
      label: "Registration Complete",
      description: isApproved
        ? `Approved for ${event?.display_name ?? team.event_slug}`
        : isRejected ? "Registration was rejected" : "Pending admin approval",
    },
  ];

  const completedCount = stages.filter(s => s.status === "done").length;
  const totalProgress  = (completedCount / stages.length) * 100;

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden py-10">

      {/* Backgrounds */}
      <RacingImageBackground src="/images/racing/f1-race-3.jpg" opacity={0.14} gradient="dark" />
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px] pointer-events-none" />
      <HaikeiDots opacity={0.3} />
      {/* Vertical racing stripe on left */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-red-600/20 to-transparent pointer-events-none" />
      <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-red-600/10 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-4">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href={dashLink} className="text-gray-500 hover:text-white text-sm transition-colors mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black">Registration Timeline</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {event?.display_name ?? team.event_slug.replace("_", " ")} — {team.team_name}
          </p>
        </motion.div>

        {/* Overall progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{completedCount} of {stages.length} stages complete</span>
            <span>{totalProgress.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Event countdown */}
        <AnimatePresence>
          {event?.event_date && countdown !== null && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              data-aos="fade-up"
              className={`mb-6 p-5 rounded-2xl border ${
                countdown <= 7
                  ? "border-red-700/50 bg-red-900/10"
                  : countdown <= 30
                  ? "border-yellow-700/50 bg-yellow-900/10"
                  : "border-white/6 bg-zinc-900/80"
              } backdrop-blur shadow-xl`}
            >
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Event Countdown</p>
              <div className="flex items-end gap-3">
                <motion.p
                  className="text-5xl font-black text-white tabular-nums"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {countdown > 0 ? countdown : 0}
                </motion.p>
                <p className="text-gray-400 mb-1 text-sm">{countdown === 1 ? "day" : "days"} remaining</p>
              </div>
              {event.event_date && <p className="text-xs text-gray-600 mt-2">Event date: {event.event_date}</p>}
              {event.venue       && <p className="text-xs text-gray-600">Venue: {event.venue}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Timeline stepper ── */}
        <div ref={containerRef} className="relative">
          {stages.map((stage, i) => {
            const theme  = stageTheme[stage.status];
            const isLast = i === stages.length - 1;

            return (
              <div key={stage.id} className="ts-stage flex gap-4">
                {/* Left: circle + connector line */}
                <div className="flex flex-col items-center">
                  <div className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 ${theme.circle} ${theme.circleBg}`}>
                    {stage.status === "done" ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5, delay: i * 0.14 + 0.5 }}
                        className="text-white text-sm font-bold"
                      >
                        ✓
                      </motion.span>
                    ) : stage.status === "active" ? (
                      <PulseDot color="#fff" />
                    ) : (
                      <span className="text-gray-600 text-sm">{i + 1}</span>
                    )}
                  </div>

                  {!isLast && (
                    <div className={`ts-line w-0.5 flex-1 my-1 min-h-[2.5rem] rounded-full ${theme.line}`} />
                  )}
                </div>

                {/* Right: content */}
                <div className={`pb-8 flex-1 ${isLast ? "pb-0" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-semibold text-sm ${theme.label}`}>{stage.label}</p>
                    {stage.status === "active" && (
                      <span className="text-xs bg-red-600/15 text-red-400 border border-red-600/30 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{stage.description}</p>
                  {stage.date && <p className="text-xs text-gray-600 mt-0.5">{stage.date}</p>}

                  {stage.note && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2 bg-yellow-900/15 border border-yellow-700/30 rounded-lg p-2"
                    >
                      <p className="text-xs text-yellow-300">{stage.note}</p>
                    </motion.div>
                  )}

                  {stage.actionHref && (
                    <Link
                      href={stage.actionHref}
                      className="mt-2 inline-block text-xs bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg transition-all hover:shadow-lg hover:shadow-red-900/20"
                    >
                      {stage.actionLabel}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default function TimelinePage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px]" />
        <RacingLoader size={48} />
      </div>
    }>
      <TimelineContent />
    </Suspense>
  );
}
