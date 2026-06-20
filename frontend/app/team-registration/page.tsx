"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";

import { motion } from "framer-motion";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { AnimatedCar } from "@/components/RacingCar";

interface EventInfo {
  slug: string;
  display_name: string;
  max_members: number;
  registration_open: boolean;
}

interface RegistrationSuccess {
  registration_id: string;
  team_name: string;
  status: string;
}

function TeamRegistrationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventSlug = searchParams.get("event") ?? "";

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<RegistrationSuccess | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      team_name: "",
      institution: "",
      city: "",
      state: "",
      members: [{ name: "", email: "", phone: "", date_of_birth: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "members" });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    if (!eventSlug) {
      router.replace("/event-selection");
      return;
    }

    api
      .get(`/api/events/${eventSlug}`)
      .then((res) => {
        setEvent(res.data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Event not found. Please select an event again.");
        router.replace("/event-selection");
      });
  }, [eventSlug, router]);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const payload = {
        event_slug: eventSlug,
        team_name: data.team_name,
        institution: data.institution,
        city: data.city,
        state: data.state,
        members: data.members.map((m: any) => ({
          name: m.name,
          email: m.email,
          phone: m.phone || null,
          date_of_birth: m.date_of_birth || null,
        })),
      };

      const res = await api.post("/api/teams", payload);
      setSuccess(res.data);
      toast.success("Team registered successfully!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail ?? "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const field =
    "w-full p-3 rounded bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-red-600 placeholder-zinc-500";

  if (loading) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px] pointer-events-none" />
        <AnimatedCar type="formula" dir="ltr" size={480} opacity={0.04} duration={26} top="65%" />
        <p className="relative z-10 text-gray-400 animate-pulse">Loading event details…</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center px-4">
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-700/6 rounded-full blur-[130px] pointer-events-none" />
        <AnimatedCar type="kart" dir="ltr" size={440} opacity={0.045} duration={22} bottom="8%" />
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 bg-zinc-900/90 backdrop-blur border border-emerald-700/40 p-8 rounded-2xl text-center max-w-md w-full shadow-2xl"
        >
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Registration Submitted!</h1>
          <p className="text-gray-400 text-sm mb-6">
            Your team has been registered for{" "}
            <span className="text-white font-medium">{event?.display_name}</span>.
          </p>

          <div className="bg-zinc-800 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
              Registration ID
            </p>
            <p className="text-2xl font-mono font-bold text-green-400">
              {success.registration_id}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Save this ID — you will need it for document upload and event day.
            </p>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4 mb-6 text-left space-y-1 text-sm">
            <p>
              <span className="text-gray-400">Team: </span>
              <span className="text-white">{success.team_name}</span>
            </p>
            <p>
              <span className="text-gray-400">Status: </span>
              <span className="text-yellow-400 capitalize">{success.status}</span>
            </p>
          </div>

          <p className="text-xs text-gray-500 mb-6">
            A confirmation email has been sent. Next: upload your required documents
            and complete the registration fee payment.
          </p>

          <button
            onClick={() => router.push(`/dashboard?event=${eventSlug}`)}
            className="w-full bg-red-600 hover:bg-red-700 p-3 rounded transition-colors mb-3"
          >
            Go to Dashboard →
          </button>
          <button
            onClick={() => router.push(`/dashboard/documents?event=${eventSlug}`)}
            className="w-full bg-zinc-700 hover:bg-zinc-600 p-3 rounded transition-colors text-sm"
          >
            Upload Documents Now
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden py-10">
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-700/6 rounded-full blur-[120px] pointer-events-none" />
      <AnimatedCar type="formula" dir="rtl" size={500} opacity={0.045} duration={28} top="72%" />
      <div className="relative z-10 max-w-2xl mx-auto px-4">

        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Team Registration</h1>
          <p className="text-red-400 mt-1">{event?.display_name}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ── Team Details ── */}
          <div className="bg-zinc-900 p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-semibold text-gray-200">Team Details</h2>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Team Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("team_name", { required: "Team name is required" })}
                placeholder="e.g. Team Velocity"
                className={field}
              />
              {errors.team_name && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.team_name.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Institution / College Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("institution", { required: "Institution is required" })}
                placeholder="e.g. ABC Engineering College"
                className={field}
              />
              {errors.institution && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.institution.message as string}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("city", { required: "City is required" })}
                  placeholder="e.g. Mumbai"
                  className={field}
                />
                {errors.city && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.city.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("state", { required: "State is required" })}
                  placeholder="e.g. Maharashtra"
                  className={field}
                />
                {errors.state && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.state.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Team Members ── */}
          <div className="bg-zinc-900 p-6 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-200">
                  Team Members
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum {event?.max_members ?? 5} members allowed
                </p>
              </div>
              {fields.length < (event?.max_members ?? 5) && (
                <button
                  type="button"
                  onClick={() =>
                    append({ name: "", email: "", phone: "", date_of_birth: "" })
                  }
                  className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded text-sm transition-colors"
                >
                  + Add Member
                </button>
              )}
            </div>

            <div className="space-y-5">
              {fields.map((f, index) => (
                <div
                  key={f.id}
                  className="border border-zinc-700 rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-300">
                      Member {index + 1}
                    </p>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register(`members.${index}.name`, {
                        required: "Name is required",
                      })}
                      placeholder="Full Name"
                      className={field}
                    />
                    {(errors.members as any)?.[index]?.name && (
                      <p className="text-red-400 text-xs mt-1">
                        {(errors.members as any)[index].name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register(`members.${index}.email`, {
                        required: "Email is required",
                        pattern: {
                          value: /^\S+@\S+\.\S+$/,
                          message: "Enter a valid email",
                        },
                      })}
                      type="email"
                      placeholder="member@example.com"
                      className={field}
                    />
                    {(errors.members as any)?.[index]?.email && (
                      <p className="text-red-400 text-xs mt-1">
                        {(errors.members as any)[index].email.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Phone
                      </label>
                      <input
                        {...register(`members.${index}.phone`)}
                        type="tel"
                        placeholder="Phone number"
                        className={field}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Date of Birth
                      </label>
                      <input
                        {...register(`members.${index}.date_of_birth`)}
                        type="date"
                        className={field}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 disabled:cursor-not-allowed p-4 rounded-xl text-lg font-semibold transition-colors"
          >
            {submitting ? "Submitting…" : "Submit Team Registration"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default function TeamRegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <p className="text-gray-400">Loading…</p>
        </div>
      }
    >
      <TeamRegistrationForm />
    </Suspense>
  );
}
