import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  ClipboardList,
  File,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileType, type MedicalRecord } from "../backend";
import { ExternalBlob } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddMedicalRecord,
  useCreateOrUpdateProfile,
  useDeleteMedicalRecord,
  useGetProfile,
  useGetRecords,
} from "../hooks/useQueries";
import { extractFileSummary } from "../utils/fileContentExtractor";
import { generateUUID } from "../utils/uuid";

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

const getAcceptString = (fileType: FileType): string => {
  switch (fileType) {
    case FileType.pdf:
      return ".pdf,application/pdf";
    case FileType.image:
      return "image/*";
    case FileType.audio:
      return "audio/*";
    case FileType.video:
      return "video/*";
    default:
      return "*";
  }
};

function formatDate(uploadDate: bigint): string {
  const ms = Number(uploadDate);
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RecordsPage() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const profileId = identity?.getPrincipal().toString() ?? null;

  // Actor is ready as soon as we have an actor instance
  const isActorReady = !!actor;

  const { data: records, isLoading } = useGetRecords(profileId);
  const { data: existingProfile } = useGetProfile(profileId);
  const { mutateAsync: saveProfile } = useCreateOrUpdateProfile();
  const { mutateAsync: addRecord, isPending: isAdding } =
    useAddMedicalRecord(profileId);
  const { mutateAsync: deleteRecord, isPending: isDeleting } =
    useDeleteMedicalRecord(profileId);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    fileType: FileType.pdf,
  });

  const [isExtractingContent, setIsExtractingContent] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Auto-detect file type
    let detectedType = FileType.other;
    if (file.type.startsWith("image/")) detectedType = FileType.image;
    else if (file.type === "application/pdf") detectedType = FileType.pdf;
    else if (file.type.startsWith("audio/")) detectedType = FileType.audio;
    else if (file.type.startsWith("video/")) detectedType = FileType.video;

    setForm((f) => ({ ...f, fileType: detectedType }));

    // Auto-populate description with extracted content summary
    setIsExtractingContent(true);
    try {
      const summary = await extractFileSummary(file);
      setForm((f) => ({
        ...f,
        fileType: detectedType,
        // Only fill if user hasn't already typed a custom description
        description: f.description.trim() === "" ? summary : f.description,
      }));
    } catch {
      // Silently ignore extraction errors
    } finally {
      setIsExtractingContent(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !form.title.trim()) {
      toast.error("Please provide a title and select a file.");
      return;
    }

    try {
      setUploadProgress(0);

      // Auto-create a minimal profile if none exists yet so the backend
      // allows the record to be added (it requires a profileOwners entry).
      if (!existingProfile && profileId) {
        await saveProfile({
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
      }

      const arrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });

      const record: MedicalRecord = {
        id: generateUUID(),
        title: form.title.trim(),
        description: form.description.trim(),
        fileType: form.fileType,
        uploadDate: BigInt(Date.now()),
        blobReference: blob,
      };

      await addRecord(record);
      toast.success("Medical record uploaded successfully");
      setForm({ title: "", description: "", fileType: FileType.pdf });
      setSelectedFile(null);
      setUploadProgress(0);
      setIsExtractingContent(false);
      setShowUploadForm(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Upload failed. Please try again.");
      setUploadProgress(0);
    }
  };

  const handleDelete = async (recordId: string) => {
    try {
      await deleteRecord(recordId);
      toast.success("Record deleted");
    } catch {
      toast.error("Failed to delete record");
    }
  };

  const cancelUpload = () => {
    setShowUploadForm(false);
    setSelectedFile(null);
    setUploadProgress(0);
    setIsExtractingContent(false);
    setForm({ title: "", description: "", fileType: FileType.pdf });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!isActorReady || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="font-display text-3xl font-black text-navy">
            Medical Records
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {records?.length ?? 0} record{records?.length !== 1 ? "s" : ""}{" "}
            uploaded
          </p>
        </div>
        <Button
          onClick={() => setShowUploadForm(true)}
          className="gap-2"
          disabled={showUploadForm}
        >
          <Plus className="w-4 h-4" />
          Upload Record
        </Button>
      </motion.div>

      {/* Upload Form */}
      <AnimatePresence>
        {showUploadForm && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="clinical-card rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-display font-bold text-lg text-navy">
                  Upload Medical Record
                </h2>
              </div>
              <button
                type="button"
                onClick={cancelUpload}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Cancel upload"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="rec-title"
                    className="text-xs font-medium text-muted-foreground mb-1.5 block"
                  >
                    Record Title *
                  </Label>
                  <Input
                    id="rec-title"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="e.g. Annual Blood Work 2025"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    File Type
                  </Label>
                  <Select
                    value={form.fileType}
                    onValueChange={(v) =>
                      setForm({ ...form, fileType: v as FileType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FILE_TYPE_CONFIG).map(([type, cfg]) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                            {cfg.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label
                    htmlFor="rec-desc"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Summary / Description
                  </Label>
                  {isExtractingContent && (
                    <span className="flex items-center gap-1 text-[10px] text-primary">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Reading file…
                    </span>
                  )}
                  {!isExtractingContent && selectedFile && form.description && (
                    <span className="text-[10px] text-emerald-600 font-medium">
                      Auto-filled from file
                    </span>
                  )}
                </div>
                <Textarea
                  id="rec-desc"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder={
                    isExtractingContent
                      ? "Extracting content from file…"
                      : "Describe what this record contains…"
                  }
                  rows={3}
                  className="resize-none"
                  disabled={isExtractingContent}
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  File *
                </Label>
                <button
                  type="button"
                  className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Select file to upload"
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <File className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-navy">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to select a file or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        PDF, Images, Audio, Video supported
                      </p>
                    </div>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={getAcceptString(form.fileType)}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {isAdding && uploadProgress > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1.5" />
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={isAdding || !form.title || !selectedFile}
                  className="flex-1 gap-2"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isAdding
                    ? `Uploading ${uploadProgress}%...`
                    : "Upload Record"}
                </Button>
                <Button type="button" variant="outline" onClick={cancelUpload}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overview Section — always visible */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl p-5 mb-5 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.22 0.10 252 / 0.06), oklch(0.58 0.22 255 / 0.04))",
          border: "1px solid oklch(0.58 0.22 255 / 0.14)",
          boxShadow: "0 2px 12px oklch(0.32 0.14 255 / 0.07)",
        }}
      >
        {/* Decorative dot */}
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-primary/5 pointer-events-none" />

        <div className="flex items-start gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-primary/12 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-sm text-navy mb-1.5 uppercase tracking-wide">
              Records Overview
            </h2>
            {!records || records.length === 0 ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                No records uploaded yet. Upload your first medical document to
                see a summary of your health records here.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-foreground/75 leading-relaxed">
                  {(() => {
                    const total = records.length;
                    const typeCounts = records.reduce(
                      (acc, r) => {
                        const label =
                          FILE_TYPE_CONFIG[r.fileType]?.label ?? "Other";
                        acc[label] = (acc[label] ?? 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>,
                    );
                    const typeSummary = Object.entries(typeCounts)
                      .map(([t, n]) => `${n} ${t}`)
                      .join(", ");
                    const latest = [...records].sort(
                      (a, b) => Number(b.uploadDate) - Number(a.uploadDate),
                    )[0];
                    return `You have ${total} medical record${total !== 1 ? "s" : ""} on file, including ${typeSummary}. Most recently uploaded: "${latest.title}" on ${formatDate(latest.uploadDate)}.`;
                  })()}
                </p>
                <div className="space-y-2 mt-3">
                  {[...records]
                    .sort((a, b) => Number(b.uploadDate) - Number(a.uploadDate))
                    .map((record) => {
                      const cfg =
                        FILE_TYPE_CONFIG[record.fileType] ??
                        FILE_TYPE_CONFIG[FileType.other];
                      const Icon = cfg.icon;
                      const gist =
                        record.description?.trim() ||
                        `A ${cfg.label.toLowerCase()} record uploaded on ${formatDate(record.uploadDate)}.`;
                      return (
                        <div
                          key={record.id}
                          className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                          style={{
                            background: "oklch(1 0 0 / 0.55)",
                            border: "1px solid oklch(0.58 0.22 255 / 0.10)",
                          }}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-navy truncate">
                              {record.title}
                            </p>
                            <p className="text-xs text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                              {gist}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Records List */}
      {!records || records.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="clinical-card rounded-2xl p-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display font-bold text-xl text-navy mb-2">
            No Records Yet
          </h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Upload your first medical record — lab results, prescriptions,
            imaging reports, and more.
          </p>
          <Button onClick={() => setShowUploadForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Upload Your First Record
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {records.map((record, i) => {
              const cfg =
                FILE_TYPE_CONFIG[record.fileType] ??
                FILE_TYPE_CONFIG[FileType.other];
              const Icon = cfg.icon;
              const accentClass = `record-item-${record.fileType}`;
              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={`clinical-card rounded-2xl p-4 flex items-center gap-4 hover:shadow-clinical-lg transition-shadow ${accentClass}`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
                  >
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-semibold text-navy text-sm truncate">
                        {record.title}
                      </h3>
                      <Badge
                        className={`text-[10px] ${cfg.bg} ${cfg.color} border-0 flex-shrink-0 px-1.5 py-0`}
                      >
                        {cfg.label}
                      </Badge>
                    </div>
                    {record.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {record.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(record.uploadDate)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={record.blobReference.getDirectURL()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors px-3 py-1.5 rounded-lg"
                    >
                      View
                    </a>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Medical Record
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{record.title}"?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(record.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
