"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "framer-motion";

import api from "@/lib/api";
import { setAuth, redirectAfterLogin, type AuthUser } from "@/lib/auth";
import { AnimatedCar } from "@/components/RacingCar";
import { RacingImageBackground } from "@/components/RacingImageBackground";

const FU = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

const STAGGER = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register: reg, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await api.post("/api/auth/register", data);
      const { access_token, user } = response.data as {
        access_token: string;
        user: AuthUser;
      };

      setAuth(access_token, user);
      toast.success("Account created! Redirecting…");
      router.push(redirectAfterLogin(user.role));
    } catch (error: any) {
      toast.error(error.response?.data?.detail ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">

      {/* Real racing photo background */}
      <RacingImageBackground src="/images/racing/f1-race-2.jpg" opacity={0.2} gradient="red" />

      {/* Grid */}
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:64px_64px] pointer-events-none" />

      {/* Glow — red-orange for register */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-orange-700/8 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-700/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Go-kart sliding left-to-right at ~30% height */}
      <AnimatedCar type="kart" dir="ltr" size={420} opacity={0.05} duration={22} delay={3} top="28%" />

      {/* Card */}
      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="show"
        className="relative z-10 w-[380px]"
      >
        {/* Logo */}
        <motion.div variants={FU} className="text-center mb-8">
          <span className="text-3xl font-black tracking-widest text-white">
            X<span className="text-red-500">SPEED</span>
          </span>
          <p className="text-gray-500 text-sm mt-1 tracking-wider uppercase">Join the Championship</p>
        </motion.div>

        {/* Nav tabs */}
        <motion.div variants={FU} className="flex gap-3 mb-6">
          <Link
            href="/login"
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-center bg-zinc-900 text-gray-400 hover:text-white border border-white/5 transition-colors"
          >
            Sign In
          </Link>
          <div className="flex-1 py-2.5 rounded-lg text-sm font-medium text-center bg-red-600 text-white shadow-lg shadow-red-900/30 select-none">
            New Account
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          variants={FU}
          className="bg-zinc-900/80 backdrop-blur-md border border-white/5 rounded-2xl p-7 shadow-2xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <motion.div variants={FU}>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                {...reg("full_name", { required: true })}
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/8 text-white placeholder-gray-600 outline-none focus:border-red-600/60 focus:ring-1 focus:ring-red-600/30 transition-all text-sm"
              />
            </motion.div>

            <motion.div variants={FU}>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                {...reg("email", { required: true })}
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/8 text-white placeholder-gray-600 outline-none focus:border-red-600/60 focus:ring-1 focus:ring-red-600/30 transition-all text-sm"
              />
            </motion.div>

            <motion.div variants={FU}>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                {...reg("phone", { required: true })}
                type="tel"
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/8 text-white placeholder-gray-600 outline-none focus:border-red-600/60 focus:ring-1 focus:ring-red-600/30 transition-all text-sm"
              />
            </motion.div>

            <motion.div variants={FU}>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                {...reg("password", { required: true })}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/8 text-white placeholder-gray-600 outline-none focus:border-red-600/60 focus:ring-1 focus:ring-red-600/30 transition-all text-sm"
              />
            </motion.div>

            <motion.div variants={FU}>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-red-900/20 hover:shadow-red-900/40 text-sm mt-2"
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </motion.div>

          </form>
        </motion.div>

        <motion.p variants={FU} className="text-center text-gray-600 text-xs mt-6">
          © {new Date().getFullYear()} XSPEED Racing Championship
        </motion.p>
      </motion.div>
    </div>
  );
}
