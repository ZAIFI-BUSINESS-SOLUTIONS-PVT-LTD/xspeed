"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";

import api from "@/lib/api";
import { isAuthenticated, getUser } from "@/lib/auth";
import { HaikeiWave, HaikeiBlobs } from "@/components/HaikeiBackground";
import { SuccessCheckmark, RacingLoader } from "@/components/AnimatedIcons";
import { RacingImageBackground } from "@/components/RacingImageBackground";

interface OrderInfo {
  order_id: string;
  amount_paise: number;
  amount_inr: number;
  currency: string;
  key_id: string;
  team_name: string;
  event_name: string;
  breakdown: {
    registration_fee: number;
    per_member_fee: number;
    member_count: number;
    per_member_total: number;
    subtotal: number;
    gst_percentage: number;
    gst_amount: number;
    grand_total: number;
  };
}

interface PaymentStatus {
  status: string;
  amount_paise: number;
  paid_at?: string;
}

declare global {
  interface Window { Razorpay: any; }
}

const ROW = {
  hidden: { opacity: 0, x: -12 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
} as const;

const ROWS = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
};

function PaymentContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const eventSlug     = searchParams.get("event") ?? "";
  const user          = getUser();
  const totalRef      = useRef<HTMLSpanElement>(null);

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [order,         setOrder]         = useState<OrderInfo | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [paying,        setPaying]        = useState(false);
  const scriptLoaded   = useRef(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/login"); return; }
    if (!scriptLoaded.current) {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      document.body.appendChild(s);
      scriptLoaded.current = true;
    }
    fetchPaymentStatus();
  }, [eventSlug]);

  // GSAP: Roll the total amount from 0 to final when order loads
  useEffect(() => {
    if (order && totalRef.current) {
      const counter = { val: 0 };
      gsap.to(counter, {
        val: order.breakdown.grand_total,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => {
          if (totalRef.current) {
            totalRef.current.textContent = `₹${counter.val.toFixed(2)}`;
          }
        },
      });
    }
  }, [order]);

  function fetchPaymentStatus() {
    const params = eventSlug ? `?event_slug=${eventSlug}` : "";
    api.get(`/api/payments/mine${params}`)
      .then((res) => setPaymentStatus(res.data))
      .catch(() => setPaymentStatus(null))
      .finally(() => setLoading(false));
  }

  async function handlePay() {
    setPaying(true);
    const params = eventSlug ? `?event_slug=${eventSlug}` : "";
    try {
      const res = await api.post(`/api/payments/create-order${params}`);
      const orderData: OrderInfo = res.data;
      setOrder(orderData);
      if (!window.Razorpay) {
        toast.error("Payment gateway failed to load. Please refresh and try again.");
        setPaying(false);
        return;
      }
      const rzp = new window.Razorpay({
        key: orderData.key_id,
        amount: orderData.amount_paise,
        currency: orderData.currency,
        name: "XSPEED Motorsports",
        description: `Registration — ${orderData.event_name}`,
        order_id: orderData.order_id,
        prefill: { name: user?.full_name ?? "", email: user?.email ?? "" },
        theme: { color: "#dc2626" },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            await api.post("/api/payments/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            toast.success("Payment successful! Your registration is confirmed.");
            fetchPaymentStatus();
          } catch {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Failed to initiate payment.");
      setPaying(false);
    }
  }

  const dashboardLink = `/dashboard${eventSlug ? `?event=${eventSlug}` : ""}`;

  if (loading) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px]" />
        <RacingLoader size={48} />
      </div>
    );
  }

  const isPaid = paymentStatus?.status === "paid";

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden py-10">

      {/* Backgrounds */}
      <RacingImageBackground src="/images/racing/f1-race-2.jpg" opacity={0.15} gradient="green" />
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px] pointer-events-none" />
      <HaikeiBlobs opacity={0.5} />
      <HaikeiWave opacity={0.6} color="#16a34a" />

      <div className="relative z-10 max-w-lg mx-auto px-4">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href={dashboardLink} className="text-gray-500 hover:text-white text-sm flex items-center gap-1 transition-colors mb-4">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black">Payment</h1>
          <p className="text-gray-400 mt-1 text-sm">Complete your registration fee payment</p>
        </motion.div>

        {/* ── Paid state ── */}
        <AnimatePresence>
          {isPaid && (
            <motion.div
              key="paid"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.35 }}
              className="bg-emerald-900/15 border border-emerald-600/40 rounded-2xl p-8 text-center mb-6 shadow-xl shadow-emerald-900/10"
            >
              <div className="flex justify-center mb-4">
                <SuccessCheckmark size={88} />
              </div>
              <h2 className="text-xl font-bold text-emerald-400">Payment Complete</h2>
              <p className="text-gray-300 mt-2 text-sm">
                ₹{((paymentStatus?.amount_paise ?? 0) / 100).toFixed(2)} paid
                {paymentStatus?.paid_at && <> on {new Date(paymentStatus.paid_at).toLocaleDateString("en-IN")}</>}
              </p>
              <p className="text-gray-600 text-xs mt-3">
                Your team registration is now awaiting admin approval.
              </p>
              <Link
                href={dashboardLink}
                className="mt-5 inline-block bg-red-600 hover:bg-red-500 px-6 py-2.5 rounded-lg transition-all text-sm font-medium"
              >
                Back to Dashboard
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Unpaid state ── */}
        {!isPaid && (
          <>
            {/* Fee breakdown card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              data-aos="fade-up"
              className="bg-zinc-900/80 backdrop-blur border border-white/6 rounded-2xl p-6 mb-5 shadow-xl overflow-hidden relative"
            >
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Fee Breakdown</h2>

              {order ? (
                <motion.div variants={ROWS} initial="hidden" animate="show" className="space-y-3 text-sm">
                  {[
                    { label: "Registration Fee", value: `₹${order.breakdown.registration_fee.toFixed(2)}` },
                    {
                      label: `Per Member (${order.breakdown.member_count} × ₹${order.breakdown.per_member_fee.toFixed(2)})`,
                      value: `₹${order.breakdown.per_member_total.toFixed(2)}`
                    },
                    { label: "Subtotal", value: `₹${order.breakdown.subtotal.toFixed(2)}`, border: true },
                    { label: `GST (${order.breakdown.gst_percentage}%)`, value: `₹${order.breakdown.gst_amount.toFixed(2)}` },
                  ].map(({ label, value, border }) => (
                    <motion.div key={label} variants={ROW} className={`flex justify-between ${border ? "border-t border-white/6 pt-3" : ""}`}>
                      <span className="text-gray-400">{label}</span>
                      <span className="text-white">{value}</span>
                    </motion.div>
                  ))}

                  <motion.div variants={ROW} className="flex justify-between border-t border-white/6 pt-3 text-base font-bold">
                    <span>Total Payable</span>
                    <span ref={totalRef} className="text-emerald-400 tabular-nums">
                      ₹{order.breakdown.grand_total.toFixed(2)}
                    </span>
                  </motion.div>
                </motion.div>
              ) : (
                <p className="text-gray-500 text-sm">
                  Click "Pay Now" to load the fee breakdown and proceed to checkout.
                </p>
              )}
            </motion.div>

            {/* Razorpay info */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              data-aos="fade-up"
              className="bg-zinc-900/80 backdrop-blur border border-white/6 rounded-2xl p-5 mb-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">R</div>
                <span className="text-sm text-gray-300">Powered by Razorpay — secured payment</span>
              </div>
              <p className="text-xs text-gray-600">Accepts UPI, Credit/Debit Cards, Net Banking, and Wallets.</p>
            </motion.div>

            {/* Pay button */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.button
                onClick={handlePay}
                disabled={paying}
                whileHover={!paying ? { scale: 1.02 } : {}}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:cursor-not-allowed py-4 rounded-2xl text-lg font-bold transition-all shadow-xl shadow-red-900/20 hover:shadow-red-900/40"
              >
                {paying ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    Opening Razorpay Checkout…
                  </span>
                ) : (
                  "Pay Registration Fee"
                )}
              </motion.button>

              <p className="text-center text-xs text-gray-600 mt-3">
                You will be redirected to Razorpay secure checkout.
              </p>
            </motion.div>
          </>
        )}

      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px]" />
        <RacingLoader size={48} />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
