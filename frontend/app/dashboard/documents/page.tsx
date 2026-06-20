"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { HaikeiDots, HaikeiWave } from "@/components/HaikeiBackground";
import { UploadIcon, RacingLoader } from "@/components/AnimatedIcons";
import { RacingImageBackground } from "@/components/RacingImageBackground";

interface Doc {
  id: number;
  doc_type: string;
  original_filename: string;
  file_size: number;
  status: string;
  reviewer_note?: string;
  uploaded_at: string;
}

const REQUIRED_DOCS = [
  { type: "noc",             label: "No Objection Certificate", hint: "From your institution / college" },
  { type: "college_id",      label: "College ID Card",          hint: "Front side clearly visible"       },
  { type: "govt_id",         label: "Government ID",             hint: "Aadhaar / PAN / Passport"         },
  { type: "driving_license", label: "Valid Driving License",     hint: "Must be valid at time of event"   },
];

const statusStyle: Record<string, { badge: string; icon: string; bar: string }> = {
  pending:  { badge: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20", icon: "⏳", bar: "bg-yellow-500" },
  approved: { badge: "bg-green-400/10  text-green-400  border-green-400/20",  icon: "✓",  bar: "bg-green-500"  },
  rejected: { badge: "bg-red-400/10    text-red-400    border-red-400/20",    icon: "✗",  bar: "bg-red-500"    },
};

function formatBytes(bytes: number) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentsContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const eventSlug    = searchParams.get("event") ?? "";

  const [docs,      setDocs]      = useState<Doc[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [pageReady, setPageReady] = useState(false);
  const fileInputRef        = useRef<HTMLInputElement>(null);
  const uploadingDocType    = useRef<string>("");

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/login"); return; }
    fetchDocs();
    setPageReady(true);
  }, [eventSlug]);

  function fetchDocs() {
    const params = eventSlug ? `?event_slug=${eventSlug}` : "";
    api.get(`/api/documents/mine${params}`)
      .then((res) => setDocs(res.data))
      .catch(() => toast.error("Failed to load documents"));
  }

  function triggerUpload(docType: string) {
    uploadingDocType.current = docType;
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const docType = uploadingDocType.current;
    setUploading(docType);
    const formData = new FormData();
    formData.append("doc_type", docType);
    formData.append("event_slug", eventSlug);
    formData.append("file", file);
    try {
      await api.post("/api/documents/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Document uploaded successfully");
      fetchDocs();
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Upload failed. Please try again.");
    } finally {
      setUploading(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const dashboardLink = `/dashboard${eventSlug ? `?event=${eventSlug}` : ""}`;
  const uploadedCount = docs.filter((d) => REQUIRED_DOCS.some((r) => r.type === d.doc_type)).length;
  const progress      = (uploadedCount / REQUIRED_DOCS.length) * 100;

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden py-10">

      {/* Backgrounds */}
      <RacingImageBackground src="/images/racing/f1-race-1.jpg" opacity={0.14} gradient="dark" />
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px] pointer-events-none" />
      <HaikeiDots opacity={0.4} />
      <HaikeiWave opacity={0.5} />

      <div className="relative z-10 max-w-2xl mx-auto px-4">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link href={dashboardLink} className="text-gray-500 hover:text-white text-sm flex items-center gap-1 transition-colors mb-4">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black">Document Upload</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Upload all 4 required documents. Accepted: PDF, JPG, PNG — max 5 MB each.
          </p>
        </motion.div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />

        {/* Document cards */}
        <div className="space-y-4">
          {REQUIRED_DOCS.map(({ type, label, hint }, idx) => {
            const doc        = docs.find((d) => d.doc_type === type);
            const style      = doc ? statusStyle[doc.status] : null;
            const isUploading = uploading === type;

            return (
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 + 0.15 }}
                data-aos="fade-up"
                data-aos-delay={idx * 80}
                className={`bg-zinc-900/80 backdrop-blur border rounded-2xl p-5 transition-all duration-300 ${
                  isUploading ? "border-red-600/40 shadow-lg shadow-red-900/10" :
                  doc?.status === "approved" ? "border-green-600/30" :
                  doc?.status === "rejected" ? "border-red-600/30" :
                  doc ? "border-white/8" :
                  "border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white text-sm">{label}</p>
                      {doc && style && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${style.badge}`}>
                          {style.icon} {doc.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{hint}</p>

                    {doc && (
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-2 space-y-1"
                        >
                          <p className="text-xs text-gray-400 truncate">{doc.original_filename} · {formatBytes(doc.file_size)}</p>
                          <p className="text-xs text-gray-600">Uploaded {new Date(doc.uploaded_at).toLocaleDateString("en-IN")}</p>
                          {doc.status === "rejected" && doc.reviewer_note && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.97 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-red-900/20 border border-red-800/40 rounded-lg p-2 mt-2"
                            >
                              <p className="text-xs text-red-300">
                                <span className="font-semibold">Rejection note:</span> {doc.reviewer_note}
                              </p>
                            </motion.div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    {isUploading && <UploadIcon size={32} active={true} />}
                    <motion.button
                      whileHover={!isUploading && uploading === null ? { scale: 1.05 } : {}}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => triggerUpload(type)}
                      disabled={isUploading || uploading !== null}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isUploading
                          ? "bg-zinc-600 cursor-wait"
                          : doc
                          ? "bg-zinc-700 hover:bg-zinc-600"
                          : "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isUploading ? "Uploading…" : doc ? "Re-upload" : "Upload"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          data-aos="fade-up"
          className="mt-6 bg-zinc-900/80 backdrop-blur border border-white/6 rounded-2xl p-5 shadow-xl"
        >
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-gray-400">Upload progress</span>
            <span className="text-white font-semibold">{uploadedCount} / {REQUIRED_DOCS.length}</span>
          </div>

          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: progress === 100
                  ? "linear-gradient(90deg, #16a34a, #22c55e)"
                  : "linear-gradient(90deg, #dc2626, #ef4444)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            />
          </div>

          {progress === 100 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-xs text-green-400 mt-2"
            >
              ✓ All documents uploaded — proceed to payment
            </motion.p>
          )}
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 flex justify-between text-sm"
        >
          <Link href={dashboardLink} className="text-gray-500 hover:text-white transition-colors">← Dashboard</Link>
          <Link
            href={`/dashboard/payment${eventSlug ? `?event=${eventSlug}` : ""}`}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-red-900/20"
          >
            Proceed to Payment →
          </Link>
        </motion.div>

      </div>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:64px_64px]" />
        <RacingLoader size={48} />
      </div>
    }>
      <DocumentsContent />
    </Suspense>
  );
}
