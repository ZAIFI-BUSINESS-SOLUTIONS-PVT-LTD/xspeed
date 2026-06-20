"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import api from "@/lib/api";
import { setAuth, type AuthUser } from "@/lib/auth";
import { AnimatedCar } from "@/components/RacingCar";
import { RacingImageBackground } from "@/components/RacingImageBackground";

const FU = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

const STAGGER = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [loading, setLoading] = useState(false);

  const { register: reg, handleSubmit, reset } = useForm();

  const onLogin = async (data: any) => {
    setLoading(true);
    try {
      const response = await api.post("/api/auth/login", data);
      const { access_token, user } = response.data as {
        access_token: string;
        user: AuthUser;
      };

      setAuth(access_token, user);
      toast.success(`Welcome back, ${user.full_name}!`);

      if (user.role === "admin" || user.role === "super_admin") {
        router.push("/admin");
        return;
      }

      try {
        await api.get("/api/teams/mine", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        router.push("/dashboard");
      } catch {
        router.push("/event-selection");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (data: any) => {
    if (data.new_password !== data.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const response = await api.put("/api/auth/reset-password", {
        email: data.email,
        new_password: data.new_password,
      });
      toast.success(response.data.message);
      reset();
      setMode("login");
    } catch (error: any) {
      toast.error(error.response?.data?.detail ?? "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">

      {/* Real racing photo background */}
      <RacingImageBackground src="/images/racing/f1-race-1.jpg" opacity={0.22} gradient="red" />

      {/* Grid */}
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:64px_64px] pointer-events-none" />

      {/* Red radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-700/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Formula car sliding across at bottom */}
      <AnimatedCar type="formula" dir="rtl" size={540} opacity={0.05} duration={28} top="68%" />

      {/* Card */}
      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="show"
        className="relative z-10 w-[360px]"
      >
        {/* Logo */}
        <motion.div variants={FU} className="text-center mb-8">
          <span className="text-3xl font-black tracking-widest text-white">
            X<span className="text-red-500">SPEED</span>
          </span>
          <p className="text-gray-500 text-sm mt-1 tracking-wider uppercase">Racing Championship</p>
        </motion.div>

        {/* Tab switcher */}
        <motion.div variants={FU} className="flex gap-3 mb-6">
          <button
            onClick={() => { setMode("login"); reset(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === "login"
                ? "bg-red-600 text-white shadow-lg shadow-red-900/30"
                : "bg-zinc-900 text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            Sign In
          </button>
          <Link
            href="/register"
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-center bg-zinc-900 text-gray-400 hover:text-white border border-white/5 transition-colors duration-200"
          >
            New Account
          </Link>
        </motion.div>

        {/* Form card */}
        <motion.div
          variants={FU}
          className="bg-zinc-900/80 backdrop-blur-md border border-white/5 rounded-2xl p-7 shadow-2xl"
        >
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit(onLogin)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    {...reg("email", { required: true })}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/8 text-white placeholder-gray-600 outline-none focus:border-red-600/60 focus:ring-1 focus:ring-red-600/30 transition-all text-sm"
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
                    className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/8 text-white placeholder-gray-600 outline-none focus:border-red-600/60 focus:ring-1 focus:ring-red-600/30 transition-all text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-red-900/20 hover:shadow-red-900/40 text-sm"
                >
                  {loading ? "Signing in…" : "Sign In"}
                </button>

                <p className="text-center">
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); reset(); }}
                    className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
                  >
                    Forgot your password?
                  </button>
                </p>
              </motion.form>
            ) : (
              <motion.form
                key="forgot"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit(onResetPassword)}
                className="space-y-4"
              >
                <p className="text-gray-400 text-sm text-center mb-2">
                  Enter your email and choose a new password.
                </p>

                <input
                  {...reg("email", { required: true })}
                  type="email"
                  placeholder="Email"
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/8 text-white placeholder-gray-600 outline-none focus:border-emerald-600/60 focus:ring-1 focus:ring-emerald-600/30 transition-all text-sm"
                />

                <input
                  {...reg("new_password", { required: true })}
                  type="password"
                  placeholder="New password"
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/8 text-white placeholder-gray-600 outline-none focus:border-emerald-600/60 focus:ring-1 focus:ring-emerald-600/30 transition-all text-sm"
                />

                <input
                  {...reg("confirm_password", { required: true })}
                  type="password"
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/8 text-white placeholder-gray-600 outline-none focus:border-emerald-600/60 focus:ring-1 focus:ring-emerald-600/30 transition-all text-sm"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-all text-sm"
                >
                  {loading ? "Updating…" : "Update Password"}
                </button>

                <p className="text-center">
                  <button
                    type="button"
                    onClick={() => { setMode("login"); reset(); }}
                    className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
                  >
                    ← Back to Sign In
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.p variants={FU} className="text-center text-gray-600 text-xs mt-6">
          © {new Date().getFullYear()} XSPEED Racing Championship
        </motion.p>
      </motion.div>
    </div>
  );
}
