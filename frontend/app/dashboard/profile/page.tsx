"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import api from "@/lib/api";
import { isAuthenticated, getUser } from "@/lib/auth";
import { HaikeiDots, CheckeredStrip } from "@/components/HaikeiBackground";
import { RacingLoader } from "@/components/AnimatedIcons";
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
  members: { id: number; name: string; email: string; phone?: string; date_of_birth?: string }[];
}

interface EventInfo { max_members: number; display_name: string; }

const LOCKED_STATUSES = new Set(["payment_done", "approved", "rejected"]);

const CARD = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

const STAGGER = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

function ProfileContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const eventSlug    = searchParams.get("event") ?? "";
  const user         = getUser();

  const [team,      setTeam]      = useState<Team | null>(null);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [editMode,  setEditMode]  = useState(false);
  const [saving,    setSaving]    = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: {
      team_name: "", institution: "", city: "", state: "",
      members: [{ name: "", email: "", phone: "", date_of_birth: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "members" });

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/login"); return; }
    const params    = eventSlug ? `?event_slug=${eventSlug}` : "";
    const eventPath = eventSlug ? `/api/events/${eventSlug}` : null;
    Promise.all([
      api.get(`/api/teams/mine${params}`),
      eventPath ? api.get(eventPath).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
    ])
      .then(([teamRes, eventRes]) => {
        const t: Team = teamRes.data;
        setTeam(t);
        if (eventRes.data) setEventInfo(eventRes.data);
        reset({
          team_name: t.team_name, institution: t.institution, city: t.city, state: t.state,
          members: t.members.map((m) => ({
            name: m.name, email: m.email,
            phone: m.phone ?? "", date_of_birth: m.date_of_birth ?? "",
          })),
        });
      })
      .catch(() => { toast.error("Could not load team profile"); router.replace("/event-selection"); })
      .finally(() => setLoading(false));
  }, [eventSlug, router, reset]);

  const isLocked  = team ? LOCKED_STATUSES.has(team.status) : false;
  const maxMembers = eventInfo?.max_members ?? 5;
  const dashLink  = `/dashboard${eventSlug ? `?event=${eventSlug}` : ""}`;

  const onSubmit = async (data: any) => {
    setSaving(true);
    const params = eventSlug ? `?event_slug=${eventSlug}` : "";
    try {
      const res = await api.put(`/api/teams/mine${params}`, {
        team_name: data.team_name, institution: data.institution, city: data.city, state: data.state,
        members: data.members.map((m: any) => ({
          name: m.name, email: m.email, phone: m.phone || null, date_of_birth: m.date_of_birth || null,
        })),
      });
      setTeam(res.data);
      setEditMode(false);
      toast.success("Team profile updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls    = "w-full px-4 py-3 rounded-lg bg-black/50 border border-white/8 text-white placeholder-zinc-600 outline-none focus:border-red-600/60 focus:ring-1 focus:ring-red-600/20 transition-all text-sm";
  const readonlyCls = "w-full px-4 py-3 rounded-lg bg-zinc-800/50 text-gray-300 border border-white/5 text-sm";

  if (loading) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px]" />
        <RacingLoader size={48} />
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden py-10">

      {/* Backgrounds */}
      <RacingImageBackground src="/images/racing/f1-race-4.jpg" opacity={0.14} gradient="dark" />
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px] pointer-events-none" />
      <HaikeiDots opacity={0.25} />
      <CheckeredStrip opacity={0.04} />

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
          <h1 className="text-3xl font-black">Team Profile</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {team.registration_id} · <span className="capitalize">{team.event_slug.replace("_", " ")}</span>
          </p>
        </motion.div>

        <motion.div variants={STAGGER} initial="hidden" animate="show">

          {/* Team leader (always read-only) */}
          <motion.div
            variants={CARD}
            data-aos="fade-up"
            className="bg-zinc-900/80 backdrop-blur border border-white/6 rounded-2xl p-6 mb-5 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              {/* Avatar initial */}
              <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-400 font-bold text-sm flex-shrink-0">
                {user?.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <h2 className="text-sm font-semibold text-gray-200">Team Leader</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">Name</p>
                <p className="text-white">{user?.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-white text-xs">{user?.email}</p>
              </div>
            </div>
          </motion.div>

          {/* Locked banner */}
          <AnimatePresence>
            {isLocked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-yellow-900/15 border border-yellow-700/30 rounded-xl p-4 mb-5 text-xs text-yellow-300"
              >
                ⚠ Team details are locked after payment is completed. Contact the event team to request changes.
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)}>

            {/* Team Details */}
            <motion.div
              variants={CARD}
              data-aos="fade-up"
              data-aos-delay="80"
              className="bg-zinc-900/80 backdrop-blur border border-white/6 rounded-2xl p-6 mb-5 shadow-xl overflow-hidden relative"
            >
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-gray-200">Team Details</h2>
                {!isLocked && (
                  <AnimatePresence mode="wait">
                    {!editMode ? (
                      <motion.button
                        key="edit"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        type="button"
                        onClick={() => setEditMode(true)}
                        className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Edit
                      </motion.button>
                    ) : (
                      <motion.button
                        key="cancel"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        type="button"
                        onClick={() => {
                          setEditMode(false);
                          reset({
                            team_name: team.team_name, institution: team.institution,
                            city: team.city, state: team.state,
                            members: team.members.map((m) => ({
                              name: m.name, email: m.email,
                              phone: m.phone ?? "", date_of_birth: m.date_of_birth ?? "",
                            })),
                          });
                        }}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </motion.button>
                    )}
                  </AnimatePresence>
                )}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={editMode ? "edit" : "view"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block uppercase tracking-wider">Team Name</label>
                    {editMode
                      ? <><input {...register("team_name", { required: "Team name is required" })} className={inputCls} />
                          {errors.team_name && <p className="text-red-400 text-xs mt-1">{errors.team_name.message as string}</p>}</>
                      : <p className={readonlyCls}>{team.team_name}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block uppercase tracking-wider">Institution</label>
                    {editMode
                      ? <><input {...register("institution", { required: "Institution is required" })} className={inputCls} />
                          {errors.institution && <p className="text-red-400 text-xs mt-1">{errors.institution.message as string}</p>}</>
                      : <p className={readonlyCls}>{team.institution}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block uppercase tracking-wider">City</label>
                      {editMode
                        ? <><input {...register("city", { required: "City is required" })} className={inputCls} />
                            {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city.message as string}</p>}</>
                        : <p className={readonlyCls}>{team.city}</p>}
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block uppercase tracking-wider">State</label>
                      {editMode
                        ? <><input {...register("state", { required: "State is required" })} className={inputCls} />
                            {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state.message as string}</p>}</>
                        : <p className={readonlyCls}>{team.state}</p>}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Team Members */}
            <motion.div
              variants={CARD}
              data-aos="fade-up"
              data-aos-delay="160"
              className="bg-zinc-900/80 backdrop-blur border border-white/6 rounded-2xl p-6 mb-5 shadow-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-gray-200">
                  Team Members ({fields.length}/{maxMembers})
                </h2>
                {editMode && fields.length < maxMembers && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    type="button"
                    onClick={() => append({ name: "", email: "", phone: "", date_of_birth: "" })}
                    className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    + Add Member
                  </motion.button>
                )}
              </div>

              <div className="space-y-4">
                {fields.map((f, i) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border border-white/6 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-red-600/20 border border-red-600/20 flex items-center justify-center text-xs text-red-400 flex-shrink-0">{i + 1}</span>
                        <p className="text-xs font-medium text-gray-300">Member {i + 1}</p>
                      </div>
                      {editMode && i > 0 && (
                        <button type="button" onClick={() => remove(i)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                          Remove
                        </button>
                      )}
                    </div>

                    {editMode ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Full Name *</label>
                          <input {...register(`members.${i}.name`, { required: "Name required" })} className={inputCls} placeholder="Full name" />
                          {(errors.members as any)?.[i]?.name && (
                            <p className="text-red-400 text-xs mt-1">{(errors.members as any)[i].name.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Email *</label>
                          <input
                            {...register(`members.${i}.email`, {
                              required: "Email required",
                              pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" },
                            })}
                            type="email" className={inputCls} placeholder="Email"
                          />
                          {(errors.members as any)?.[i]?.email && (
                            <p className="text-red-400 text-xs mt-1">{(errors.members as any)[i].email.message}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">Phone</label>
                            <input {...register(`members.${i}.phone`)} type="tel" className={inputCls} placeholder="Phone" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">Date of Birth</label>
                            <input {...register(`members.${i}.date_of_birth`)} type="date" className={inputCls} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm">
                        <p className="text-white">{team.members[i]?.name}</p>
                        <p className="text-gray-400 text-xs">{team.members[i]?.email}</p>
                        {team.members[i]?.phone && <p className="text-gray-500 text-xs">{team.members[i].phone}</p>}
                        {team.members[i]?.date_of_birth && <p className="text-gray-500 text-xs">DOB: {team.members[i].date_of_birth}</p>}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Save button */}
            <AnimatePresence>
              {editMode && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                >
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={!saving ? { scale: 1.02 } : {}}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:cursor-not-allowed py-4 rounded-2xl font-bold transition-all shadow-xl shadow-red-900/20 hover:shadow-red-900/40"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                        Saving…
                      </span>
                    ) : "Save Changes"}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

          </form>
        </motion.div>

      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px]" />
        <RacingLoader size={48} />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
