import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Brain,
  Calendar,
  CheckCircle2,
  ClipboardList,
  File,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Heart,
  QrCode,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { type Variants, motion } from "motion/react";
import { FileType, type MedicalRecord } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetRecords } from "../hooks/useQueries";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const FILE_TYPE_CONFIG: Record<
  FileType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
  }
> = {
  [FileType.pdf]: {
    label: "PDF",
    icon: FileText,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
  },
  [FileType.image]: {
    label: "Image",
    icon: FileImage,
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200",
  },
  [FileType.audio]: {
    label: "Audio",
    icon: FileAudio,
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
  },
  [FileType.video]: {
    label: "Video",
    icon: FileVideo,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
  },
  [FileType.other]: {
    label: "Other",
    icon: File,
    color: "text-gray-600",
    bg: "bg-gray-50 border-gray-200",
  },
};

function formatDate(uploadDate: bigint): string {
  const ms = Number(uploadDate);
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function DocumentsOverviewCard({
  isAuthenticated,
  profileId,
}: {
  isAuthenticated: boolean;
  profileId: string | null;
}) {
  const { data: records, isLoading } = useGetRecords(
    isAuthenticated ? profileId : null,
  );

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="feature-card-qr rounded-2xl p-8 group cursor-default relative overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <ClipboardList className="w-7 h-7 text-primary" />
      </div>
      <Badge className="bg-primary/10 text-primary border-primary/20 border text-xs mb-4 w-fit">
        Your Records
      </Badge>
      <h3 className="font-display text-2xl font-bold text-navy mb-3">
        Documents Overview
      </h3>
      <p className="text-muted-foreground leading-relaxed mb-6 text-sm">
        A quick glance at your uploaded medical records — always organised,
        always accessible.
      </p>

      {/* Content */}
      {!isAuthenticated ? (
        <div className="flex-1 flex flex-col">
          <div className="bg-secondary/60 rounded-xl p-4 border border-border space-y-2.5 mb-5">
            {[
              {
                icon: FileText,
                label: "Annual Blood Work 2025",
                type: "PDF",
                color: "text-red-600",
                bg: "bg-red-50",
              },
              {
                icon: FileImage,
                label: "Chest X-Ray Report",
                type: "Image",
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
              {
                icon: FileText,
                label: "Cardiology Consultation",
                type: "PDF",
                color: "text-red-600",
                bg: "bg-red-50",
              },
            ].map(({ icon: Icon, label, type, color, bg }) => (
              <div key={label} className="flex items-center gap-3 opacity-50">
                <div
                  className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-navy truncate">
                    {label}
                  </p>
                </div>
                <Badge
                  className={`text-[10px] ${bg} ${color} border-0 px-1.5 py-0 flex-shrink-0`}
                >
                  {type}
                </Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Sign in to see your actual records
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-2.5 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : !records || records.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-3">
            <ClipboardList className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-navy mb-1">No records yet</p>
          <p className="text-xs text-muted-foreground mb-4 max-w-[180px]">
            Upload your first medical document to see it here.
          </p>
          <Link to="/records">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs border-primary/30 hover:bg-primary/5"
            >
              Upload a Record
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div
            className="space-y-2 mb-4 overflow-hidden"
            style={{ maxHeight: 220 }}
          >
            {records.slice(0, 4).map((record: MedicalRecord) => {
              const cfg =
                FILE_TYPE_CONFIG[record.fileType] ??
                FILE_TYPE_CONFIG[FileType.other];
              const Icon = cfg.icon;
              return (
                <div
                  key={record.id}
                  className="flex items-center gap-3 group/item"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${cfg.bg}`}
                  >
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-navy truncate leading-tight">
                      {record.title}
                    </p>
                    {record.description ? (
                      <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                        {record.description}
                      </p>
                    ) : (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5 text-muted-foreground/60" />
                        <span className="text-[10px] text-muted-foreground/60">
                          {formatDate(record.uploadDate)}
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge
                    className={`text-[10px] ${cfg.bg} ${cfg.color} border-0 px-1.5 py-0 flex-shrink-0`}
                  >
                    {cfg.label}
                  </Badge>
                </div>
              );
            })}
          </div>
          {records.length > 4 && (
            <p className="text-[10px] text-muted-foreground text-center mb-3">
              +{records.length - 4} more record
              {records.length - 4 !== 1 ? "s" : ""}
            </p>
          )}
          <Link to="/records" className="mt-auto">
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5 text-xs border-primary/30 hover:bg-primary/5"
            >
              View All Records
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      )}
    </motion.div>
  );
}

const stats = [
  { value: "< 5s", label: "Emergency data access", icon: Zap },
  { value: "100%", label: "Encrypted & secure", icon: ShieldCheck },
  { value: "Always", label: "Available anywhere", icon: Activity },
  { value: "AI", label: "Powered summaries", icon: Brain },
];

export default function LandingPage() {
  const { identity, login, loginStatus } = useInternetIdentity();
  const profileId = identity?.getPrincipal().toString() ?? null;
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleLogin = async () => {
    try {
      await login();
    } catch {}
  };

  return (
    <main>
      {/* Hero Section */}
      <section className="hero-mesh relative overflow-hidden min-h-[85vh] flex items-center">
        {/* Background decorative ECG line */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg
            className="absolute bottom-0 left-0 right-0 w-full opacity-10"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,60 L200,60 L230,10 L260,110 L290,10 L320,110 L350,60 L1200,60"
              stroke="white"
              strokeWidth="2"
              fill="none"
              style={{
                strokeDasharray: 400,
                strokeDashoffset: 400,
                animation: "ecg-draw 2s ease-out 0.5s forwards",
              }}
            />
          </svg>

          {/* Floating orbs */}
          <div className="absolute top-1/4 right-10 w-48 h-48 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute bottom-1/4 left-10 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeUp} className="mb-4">
                <Badge className="bg-white/15 text-white border-white/20 gap-1.5 text-xs backdrop-blur-sm">
                  <Activity className="w-3 h-3" />
                  Emergency-Ready Medical Identity
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="font-display text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.02] mb-6 tracking-tight"
              >
                Your Medical
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-100">
                  Identity.
                </span>
                <br />
                <span className="text-white/80 text-4xl md:text-5xl lg:text-6xl font-bold">
                  Always Accessible.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-blue-100/80 text-lg leading-relaxed mb-8 max-w-lg"
              >
                PulseCard gives you a secure digital medical profile with
                AI-powered summaries and a unique QR code — so doctors can
                access your critical health data instantly, anywhere.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row gap-3"
              >
                {isAuthenticated ? (
                  <Link to="/profile">
                    <Button
                      size="lg"
                      className="bg-white text-navy hover:bg-blue-50 gap-2 font-semibold"
                    >
                      Go to My Profile
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button
                      size="lg"
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      className="bg-white text-navy hover:bg-blue-50 gap-2 font-semibold"
                    >
                      {isLoggingIn ? "Connecting..." : "Get Started Free"}
                      {!isLoggingIn && <ArrowRight className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="flex flex-wrap gap-4 mt-8"
              >
                {[
                  "Encrypted on ICP",
                  "No data brokers",
                  "You own your data",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-1.5 text-sm text-blue-100/70"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    {item}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Hero Image + Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <img
                  src="/assets/generated/pulsecard-hero.dim_1200x600.jpg"
                  alt="PulseCard Medical Interface"
                  className="rounded-2xl w-full object-cover shadow-2xl border border-white/10"
                  style={{ maxHeight: 380 }}
                />
                {/* Floating card overlay */}
                {/* Floating card: Blood Type */}
                <motion.div
                  initial={{ opacity: 0, y: 16, x: 8 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute -bottom-7 -left-5 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,30,0.25)] border border-white/60"
                  style={{
                    background: "oklch(1 0 0 / 0.92)",
                    backdropFilter: "blur(16px)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                      <Heart
                        className="w-5 h-5 text-red-500"
                        fill="currentColor"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Blood Type
                      </p>
                      <p
                        className="font-display font-black text-xl leading-tight"
                        style={{ color: "oklch(0.20 0.09 252)" }}
                      >
                        A+
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating card: AI Summary */}
                <motion.div
                  initial={{ opacity: 0, y: -12, x: -8 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                  className="absolute -top-5 -right-5 rounded-2xl p-3.5 shadow-[0_8px_32px_rgba(0,0,30,0.25)] border border-white/60"
                  style={{
                    background: "oklch(1 0 0 / 0.92)",
                    backdropFilter: "blur(16px)",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        AI Summary
                      </p>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "oklch(0.20 0.09 252)" }}
                      >
                        Ready for emergency
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x-0 md:divide-x divide-border"
          >
            {stats.map(({ value, label, icon: Icon }) => (
              <motion.div
                key={label}
                variants={fadeUp}
                className="flex items-center gap-3 md:px-6 first:pl-0"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary/8 border border-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-black text-2xl text-navy leading-none">
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {label}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Core Features
            </Badge>
            <h2 className="font-display text-4xl font-black text-navy mb-4">
              Built for Real Emergencies
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Two powerful features that could save your life — intelligent AI
              summarization and instant QR access.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8 items-stretch"
          >
            {/* AI Medical Summary card */}
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="feature-card-ai rounded-2xl p-8 group cursor-default relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 relative z-10">
                <Brain className="w-7 h-7 text-primary" />
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20 border text-xs mb-4 relative z-10">
                AI Medical Summary
              </Badge>
              <h3 className="font-display text-2xl font-bold text-navy mb-3 relative z-10">
                Instant AI Medical Summary
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6 text-sm relative z-10">
                Our AI Agent analyzes your uploaded records and conditions to
                generate a clear, concise summary that doctors can understand at
                a glance — even in emergencies.
              </p>
              <ul className="space-y-2.5 relative z-10">
                {[
                  "Summarizes complex medical data",
                  "Natural language output",
                  "Updated with each record upload",
                ].map((h) => (
                  <li
                    key={h}
                    className="flex items-center gap-2 text-sm text-foreground/80"
                  >
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-primary" />
                    {h}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Documents Overview card */}
            <DocumentsOverviewCard
              isAuthenticated={isAuthenticated}
              profileId={profileId}
            />
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-secondary/40">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-black text-navy mb-4">
              How PulseCard Works
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Set up once, use forever. Your medical identity is always just a
              scan away.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {[
              {
                step: "01",
                icon: ShieldCheck,
                title: "Secure Login",
                desc: "Sign in with Internet Identity — no passwords, no data breaches. Your identity is cryptographically secured.",
              },
              {
                step: "02",
                icon: FileText,
                title: "Build Your Profile",
                desc: "Add your blood type, allergies, medications, conditions, and upload medical records. The AI generates a summary automatically.",
              },
              {
                step: "03",
                icon: QrCode,
                title: "Share Your QR",
                desc: "Your unique QR code is always ready. Show it to any doctor or responder for instant access to your emergency info.",
              },
            ].map(({ step, icon: Icon, title, desc }, i) => (
              <motion.div
                key={step}
                variants={fadeUp}
                className="relative text-center"
              >
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-border -translate-x-1/2 z-0" />
                )}
                <div className="relative z-10 inline-flex w-16 h-16 rounded-2xl bg-white shadow-clinical items-center justify-center mb-4 mx-auto">
                  <Icon className="w-7 h-7 text-primary" />
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center font-display">
                    {step.slice(-1)}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-navy mb-2">
                  {title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="hero-mesh py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-white" fill="white" />
            </div>
            <h2 className="font-display text-4xl font-black text-white mb-4">
              Your Health Data. Your Control.
            </h2>
            <p className="text-blue-100/80 text-lg mb-8 max-w-md mx-auto">
              Create your PulseCard today and ensure your medical information is
              accessible in any emergency.
            </p>
            {isAuthenticated ? (
              <Link to="/profile">
                <Button
                  size="lg"
                  className="bg-white text-navy hover:bg-blue-50 gap-2 font-semibold"
                >
                  Go to My Profile <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="bg-white text-navy hover:bg-blue-50 gap-2 font-semibold"
              >
                Create Your PulseCard <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            <p className="text-blue-100/50 text-xs mt-4 flex items-center justify-center gap-1.5">
              <Users className="w-3 h-3" />
              Secured by Internet Computer — no passwords required
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
