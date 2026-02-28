import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  Loader2,
  QrCode,
  Save,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { PatientProfile } from "../backend";
import QRCodeDisplay from "../components/QRCodeDisplay";
import TagInput from "../components/TagInput";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreateOrUpdateProfile, useGetProfile } from "../hooks/useQueries";

const BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
];

const emptyProfile = (profileId: string): PatientProfile => ({
  profileId,
  name: "",
  dateOfBirth: "",
  bloodType: "Unknown",
  allergies: [],
  conditions: [],
  medications: [],
  emergencyContactName: "",
  emergencyContactPhone: "",
  aiSummary: "",
});

function ProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const profileId = identity?.getPrincipal().toString() ?? null;

  // Actor is ready as soon as we have an actor instance
  const isActorReady = !!actor;

  const {
    data: profile,
    isLoading,
    isFetched,
    isError,
  } = useGetProfile(profileId);
  const { mutateAsync: saveProfile, isPending: isSaving } =
    useCreateOrUpdateProfile();

  const [form, setForm] = useState<PatientProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  // Track whether we've already initialized the form to avoid resetting on
  // background re-fetches (e.g. after the actor invalidates queries).
  const formInitialized = useRef(false);

  // Initialize form when profile loads — runs whenever the query resolves
  useEffect(() => {
    // Only initialise once the actor is ready and the query has completed
    if (!isActorReady || !profileId) return;
    if (isFetched) {
      if (profile) {
        // Always sync form from profile on first load; after that only if not editing
        if (!formInitialized.current || !isEditing) {
          setForm(profile);
          setIsEditing(false);
          formInitialized.current = true;
        }
      } else if (!formInitialized.current) {
        // New user — pre-fill empty form and enter edit mode (only once)
        setForm(emptyProfile(profileId));
        setIsEditing(true);
        formInitialized.current = true;
      }
    }
  }, [profile, isFetched, profileId, isActorReady, isEditing]);

  const handleSave = async () => {
    if (!form) return;
    try {
      await saveProfile(form);
      toast.success("Profile saved successfully");
      setIsEditing(false);
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  const copyProfileLink = () => {
    const url = `${window.location.origin}/patient/${profileId}`;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied!");
  };

  // Show skeleton while actor is initializing or the profile query is in-flight
  if (!isActorReady || isLoading) {
    return <ProfileSkeleton />;
  }

  // If there was an error and the form is still null, show the empty setup form
  // so the user can still create their profile rather than seeing a stuck screen.
  if (!form && isError && profileId) {
    // Side-effect-free: initialize directly so user can still use the page
    const fallback = emptyProfile(profileId);
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="clinical-card rounded-2xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="font-display font-bold text-xl text-navy">
            Could not load profile
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            There was a problem fetching your profile data. Please refresh the
            page or try again.
          </p>
          <Button onClick={() => setForm(fallback)} className="gap-2 mt-2">
            <User className="w-4 h-4" />
            Set Up New Profile
          </Button>
        </div>
      </div>
    );
  }

  // Give effect one render cycle to initialise form after isFetched flips true
  if (!form) {
    return <ProfileSkeleton />;
  }

  const isNewProfile = !profile;
  const qrUrl = profileId
    ? `${window.location.origin}/patient/${profileId}`
    : "";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="font-display text-3xl font-black text-navy">
            {isNewProfile ? "Create Your Profile" : "My Medical Profile"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isNewProfile
              ? "Set up your digital medical identity"
              : "Your personal health information and emergency data"}
          </p>
        </div>
        {!isNewProfile && (
          <Button
            variant={isEditing ? "outline" : "default"}
            size="sm"
            onClick={() => {
              if (isEditing) {
                setForm(profile ?? form);
              }
              setIsEditing(!isEditing);
            }}
            className="gap-2"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        )}
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Profile Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="clinical-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-display font-bold text-lg text-navy">
                Personal Information
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="name"
                  className="text-xs font-medium text-muted-foreground mb-1.5 block"
                >
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Sarah Johnson"
                  disabled={!isEditing}
                  className="disabled:opacity-80 disabled:cursor-default"
                />
              </div>
              <div>
                <Label
                  htmlFor="dob"
                  className="text-xs font-medium text-muted-foreground mb-1.5 block"
                >
                  Date of Birth *
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    setForm({ ...form, dateOfBirth: e.target.value })
                  }
                  disabled={!isEditing}
                  className="disabled:opacity-80 disabled:cursor-default"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Blood Type *
                </Label>
                {isEditing ? (
                  <Select
                    value={form.bloodType}
                    onValueChange={(v) => setForm({ ...form, bloodType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center h-9">
                    <Badge className="blood-type-badge bg-red-50 text-red-700 border-red-200 text-sm px-3 py-1">
                      {form.bloodType || "Not set"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Medical Data */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="clinical-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-destructive" />
              </div>
              <h2 className="font-display font-bold text-lg text-navy">
                Medical Data
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                  Allergies
                </Label>
                {isEditing ? (
                  <TagInput
                    tags={form.allergies}
                    onChange={(tags) => setForm({ ...form, allergies: tags })}
                    placeholder="e.g. Penicillin, Peanuts..."
                    colorClass="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
                    {form.allergies.length === 0 ? (
                      <span className="text-muted-foreground text-sm italic">
                        No allergies listed
                      </span>
                    ) : (
                      form.allergies.map((a) => (
                        <Badge
                          key={a}
                          className="bg-red-50 text-red-700 border-red-200 text-xs"
                        >
                          {a}
                        </Badge>
                      ))
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                  Medical Conditions
                </Label>
                {isEditing ? (
                  <TagInput
                    tags={form.conditions}
                    onChange={(tags) => setForm({ ...form, conditions: tags })}
                    placeholder="e.g. Hypertension, Diabetes..."
                    colorClass="bg-amber-50 text-amber-700 border-amber-200"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
                    {form.conditions.length === 0 ? (
                      <span className="text-muted-foreground text-sm italic">
                        No conditions listed
                      </span>
                    ) : (
                      form.conditions.map((c) => (
                        <Badge
                          key={c}
                          className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                        >
                          {c}
                        </Badge>
                      ))
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
                  Current Medications
                </Label>
                {isEditing ? (
                  <TagInput
                    tags={form.medications}
                    onChange={(tags) => setForm({ ...form, medications: tags })}
                    placeholder="e.g. Metformin 500mg, Lisinopril..."
                    colorClass="bg-blue-50 text-blue-700 border-blue-200"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
                    {form.medications.length === 0 ? (
                      <span className="text-muted-foreground text-sm italic">
                        No medications listed
                      </span>
                    ) : (
                      form.medications.map((m) => (
                        <Badge
                          key={m}
                          className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                        >
                          {m}
                        </Badge>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Emergency Contact */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="clinical-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <h2 className="font-display font-bold text-lg text-navy">
                Emergency Contact
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="ec-name"
                  className="text-xs font-medium text-muted-foreground mb-1.5 block"
                >
                  Contact Name
                </Label>
                <Input
                  id="ec-name"
                  value={form.emergencyContactName}
                  onChange={(e) =>
                    setForm({ ...form, emergencyContactName: e.target.value })
                  }
                  placeholder="Jane Johnson"
                  disabled={!isEditing}
                  className="disabled:opacity-80 disabled:cursor-default"
                />
              </div>
              <div>
                <Label
                  htmlFor="ec-phone"
                  className="text-xs font-medium text-muted-foreground mb-1.5 block"
                >
                  Contact Phone
                </Label>
                <Input
                  id="ec-phone"
                  type="tel"
                  value={form.emergencyContactPhone}
                  onChange={(e) =>
                    setForm({ ...form, emergencyContactPhone: e.target.value })
                  }
                  placeholder="+1 (555) 000-0000"
                  disabled={!isEditing}
                  className="disabled:opacity-80 disabled:cursor-default"
                />
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          {isEditing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button
                onClick={handleSave}
                disabled={isSaving || !form.name || !form.dateOfBirth}
                className="w-full gap-2 h-11"
                size="lg"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving
                  ? "Saving..."
                  : isNewProfile
                    ? "Create Profile"
                    : "Save Changes"}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Right Sidebar: AI Summary + QR Code */}
        <div className="space-y-6">
          {/* AI Summary — elevated dark panel */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="ai-summary-panel rounded-2xl p-5 relative overflow-hidden"
          >
            {/* Decorative orb */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

            <div className="flex items-center gap-2.5 mb-4 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <Brain className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-white">
                  AI Medical Summary
                </h3>
                <p className="text-[10px] text-white/50">
                  Auto-generated from your data
                </p>
              </div>
            </div>

            {form.aiSummary ? (
              <div className="bg-white/10 rounded-xl p-3.5 border border-white/15 relative z-10">
                <p className="text-xs text-white/90 leading-relaxed">
                  {form.aiSummary}
                </p>
              </div>
            ) : (
              <div className="bg-white/8 rounded-xl p-3.5 border border-white/10 relative z-10">
                <div className="flex items-start gap-2.5">
                  <Brain className="w-3.5 h-3.5 text-white/40 mt-0.5 flex-shrink-0 animate-ecg-blink" />
                  <p className="text-xs text-white/55 leading-relaxed">
                    No AI summary yet. Upload medical records and complete your
                    profile — the AI will generate a summary of your health
                    data.
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* QR Code — emergency-ready bordered panel */}
          {profileId && !isNewProfile && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="qr-emergency-panel rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-primary" />
                  <h3 className="font-display font-bold text-sm text-navy">
                    Emergency QR Code
                  </h3>
                </div>
                <span className="text-[9px] font-bold tracking-widest uppercase text-primary/60 bg-primary/8 rounded-full px-2 py-0.5">
                  Live
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-4">
                Show this to any doctor for instant emergency access
              </p>

              <QRCodeDisplay url={qrUrl} />

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs border-primary/30 hover:bg-primary/5"
                  onClick={copyProfileLink}
                >
                  <Copy className="w-3 h-3" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs border-primary/30 hover:bg-primary/5"
                  asChild
                >
                  <a href={qrUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3" />
                    Preview
                  </a>
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
