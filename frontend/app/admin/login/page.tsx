"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "framer-motion";

import api from "@/lib/api";
import { setAuth, type AuthUser } from "@/lib/auth";

const FU = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

const STAGGER = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register: reg, handleSubmit } = useForm();

  const onLogin = async (data: any) => {
    setLoading(true);
    try {
      const response = await api.post("/api/auth/login", data);
      const { access_token, user } = response.data as {
        access_token: string;
        user: AuthUser;
      };

      if (user.role !== "admin" && user.role !== "super_admin") {
        toast.error("Access denied. This portal is restricted to administrators.");
        return;
      }

      setAuth(access_token, user);
      toast.success(`Welcome, ${user.full_name}`);
      router.push("/admin");
    } catch (error: any) {
      toast.error(error.response?.data?.detail ?? "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white overflow-hidden flex items-center justify-center">

      {/* Subtle dark grid */}
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:80px_80px] pointer-events-none" />

      {/* Deep red glow — center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-950/40 rounded-full blur-[140px] pointer-events-none" />

      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-700/50 to-transparent" />

      {/* Card */}
      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="show"
        className="relative z-10 w-[360px]"
      >
        {/* Lock icon + branding */}
        <motion.div variants={FU} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-950/60 border border-red-800/30 mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">Staff Portal</h1>
          <p className="text-gray-600 text-xs mt-1 tracking-widest uppercase">
            XSPEED Administration
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          variants={FU}
          className="bg-zinc-900/90 backdrop-blur border border-white/5 rounded-2xl p-7 shadow-2xl"
        >
          <form onSubmit={handleSubmit(onLogin)} className="space-y-4">

            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                Administrator Email
              </label>
              <input
                {...reg("email", { required: true })}
                type="email"
                placeholder="admin@xspeed.in"
                autoComplete="username"
                className="w-full px-4 py-3 rounded-lg bg-black/60 border border-white/8 text-white placeholder-gray-700 outline-none focus:border-red-700/60 focus:ring-1 focus:ring-red-700/30 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                {...reg("password", { required: true })}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-lg bg-black/60 border border-white/8 text-white placeholder-gray-700 outline-none focus:border-red-700/60 focus:ring-1 focus:ring-red-700/30 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-all duration-200 mt-2 text-sm tracking-wide"
            >
              {loading ? "Authenticating…" : "Access Admin Panel"}
            </button>

          </form>
        </motion.div>

        {/* Restricted notice */}
        <motion.div variants={FU} className="mt-5 flex items-center gap-2 justify-center">
          <div className="h-px flex-1 bg-white/5" />
          <p className="text-gray-700 text-[11px] tracking-widest uppercase px-3">
            Restricted Access
          </p>
          <div className="h-px flex-1 bg-white/5" />
        </motion.div>

        <motion.p variants={FU} className="text-center text-gray-700 text-[11px] mt-3">
          Unauthorized access is strictly prohibited and monitored.
        </motion.p>
      </motion.div>
    </div>
  );
}
