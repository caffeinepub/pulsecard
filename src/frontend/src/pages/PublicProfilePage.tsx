import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Heart,
  Info,
  Loader2,
  Phone,
  Pill,
  QrCode,
  ShieldAlert,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import QRCodeDisplay from "../components/QRCodeDisplay";
import { useGetMedicalSummary } from "../hooks/useQueries";

const BLOOD_TYPE_COLORS: Record<string, { bg: string; ring: string }> = {
  "A+": { bg: "bg-red-600 text-white", ring: "ring-red-300" },
  "A-": { bg: "bg-red-700 text-white", ring: "ring-red-400" },
  "B+": { bg: "bg-orange-500 text-white", ring: "ring-orange-300" },
  "B-": { bg: "bg-orange-700 text-white", ring: "ring-orange-400" },
  "AB+": { bg: "bg-purple-600 text-white", ring: "ring-purple-300" },
  "AB-": { bg: "bg-purple-800 text-white", ring: "ring-purple-400" },
  "O+": { bg: "bg-blue-600 text-white", ring: "ring-blue-300" },
  "O-": { bg: "bg-blue-800 text-white", ring: "ring-blue-400" },
};

export default function PublicProfilePage() {
  const { profileId } = useParams({ from: "/patient/$profileId" });
  const {
    data: summary,
    isLoading,
    error,
  } = useGetMedicalSummary(profileId ?? null);

  const qrUrl = profileId
    ? `${window.location.origin}/patient/${profileId}`
    : "";

  const bloodConfig = summary?.bloodType
    ? (BLOOD_TYPE_COLORS[summary.bloodType] ?? {
        bg: "bg-slate-600 text-white",
        ring: "ring-slate-300",
      })
    : { bg: "bg-slate-600 text-white", ring: "ring-slate-300" };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <Heart
              className="w-4 h-4 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              fill="currentColor"
            />
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            Loading emergency information...
          </p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-5 shadow-clinical">
            <Info className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-display text-2xl font-black text-navy mb-2">
            Profile Not Found
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            No medical profile found for this ID. The patient may not have set
            up their PulseCard yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Emergency Banner — high-contrast, visually urgent */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.38 0.22 22), oklch(0.30 0.18 15))",
        }}
      >
        {/* Subtle ECG pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          viewBox="0 0 800 64"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            points="0,32 100,32 120,8 140,56 160,8 180,56 200,32 800,32"
            stroke="white"
            strokeWidth="2"
            fill="none"
          />
        </svg>

        <div className="container mx-auto max-w-2xl px-4 py-4 flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5 text-white">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase opacity-80">
                Emergency
              </p>
              <p className="text-sm font-semibold leading-none">
                Medical Information
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5 text-xs text-white font-medium border border-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            For Medical Personnel
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-6">
        <Tabs defaultValue="emergency" className="space-y-5">
          <TabsList className="w-full grid grid-cols-2 h-11">
            <TabsTrigger
              value="emergency"
              className="gap-2 text-sm font-medium"
            >
              <Heart className="w-3.5 h-3.5" />
              Emergency Info
            </TabsTrigger>
            <TabsTrigger value="qr" className="gap-2 text-sm font-medium">
              <QrCode className="w-3.5 h-3.5" />
              QR Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="emergency" className="space-y-4">
            {/* Patient Header — prominent blood type */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="clinical-card rounded-2xl p-5 flex items-start justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-black text-navy leading-none">
                    {summary.name}
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Patient Record
                  </p>
                </div>
              </div>

              {/* Blood Type — large, bold, immediately visible */}
              <div
                className={`pulse-badge ${bloodConfig.bg} rounded-2xl px-5 py-4 text-center min-w-[5rem] flex-shrink-0 ring-4 ring-offset-2 ${bloodConfig.ring} shadow-lg`}
              >
                <p className="text-[9px] font-bold tracking-widest uppercase opacity-70 mb-1">
                  Blood Type
                </p>
                <p className="blood-type-badge text-3xl font-black leading-none">
                  {summary.bloodType || "?"}
                </p>
              </div>
            </motion.div>

            {/* Emergency Contact — high-priority green card */}
            {(summary.emergencyContactName ||
              summary.emergencyContactPhone) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl p-5 overflow-hidden relative"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.20 0.12 155), oklch(0.26 0.10 145))",
                  boxShadow: "0 4px 20px oklch(0.20 0.12 155 / 0.30)",
                }}
              >
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
                <div className="flex items-center gap-2 mb-4 relative z-10">
                  <AlertTriangle className="w-4 h-4 text-white/90" />
                  <h2 className="font-display font-bold text-base text-white">
                    Emergency Contact
                  </h2>
                </div>
                <div className="flex items-center justify-between gap-4 relative z-10">
                  <div>
                    <p className="font-bold text-white text-lg leading-tight">
                      {summary.emergencyContactName}
                    </p>
                    <p className="text-sm text-white/70 mt-0.5">
                      {summary.emergencyContactPhone}
                    </p>
                  </div>
                  {summary.emergencyContactPhone && (
                    <a
                      href={`tel:${summary.emergencyContactPhone}`}
                      className="flex items-center gap-2.5 bg-white text-green-800 px-5 py-3 rounded-xl font-bold text-sm hover:bg-green-50 active:scale-95 transition-all shadow-md flex-shrink-0"
                    >
                      <Phone className="w-4 h-4" fill="currentColor" />
                      Call Now
                    </a>
                  )}
                </div>
              </motion.div>
            )}

            {/* Allergies — visually urgent */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="clinical-card rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                </div>
                <h2 className="font-display font-bold text-base text-navy">
                  Allergies
                </h2>
                {summary.allergies.length > 0 && (
                  <Badge className="bg-red-100 text-red-700 border-red-200 text-xs ml-auto">
                    {summary.allergies.length} known
                  </Badge>
                )}
              </div>
              {summary.allergies.length === 0 ? (
                <p className="text-muted-foreground text-sm italic">
                  No known allergies on record
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {summary.allergies.map((a) => (
                    <Badge
                      key={a}
                      className="bg-red-50 text-red-700 border border-red-200 font-semibold text-sm py-1 px-3"
                    >
                      ⚠ {a}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Conditions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="clinical-card rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <h2 className="font-display font-bold text-base text-navy">
                  Medical Conditions
                </h2>
              </div>
              {summary.conditions.length === 0 ? (
                <p className="text-muted-foreground text-sm italic">
                  No conditions on record
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {summary.conditions.map((c) => (
                    <Badge
                      key={c}
                      className="bg-amber-50 text-amber-700 border border-amber-200 text-sm py-1 px-3"
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Footer disclaimer */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/80 rounded-xl p-3.5 border border-border">
              <Pill className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-muted-foreground/60" />
              <p>
                Emergency summary only. Full records including medications
                require patient authorization. Powered by{" "}
                <strong className="text-foreground">PulseCard</strong>.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="qr">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="clinical-card rounded-2xl p-6 text-center space-y-5"
            >
              <div>
                <h2 className="font-display font-bold text-xl text-navy mb-1">
                  Patient QR Code
                </h2>
                <p className="text-muted-foreground text-sm">
                  Scan to access {summary.name}&apos;s emergency medical profile
                </p>
              </div>
              <div className="flex justify-center p-4 bg-secondary/40 rounded-2xl">
                <QRCodeDisplay url={qrUrl} size={200} />
              </div>
              <p className="text-xs text-muted-foreground break-all font-mono bg-secondary/60 rounded-lg p-2.5">
                {qrUrl}
              </p>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
