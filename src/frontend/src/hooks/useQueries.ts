import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MedicalRecord, MedicalSummary, PatientProfile } from "../backend";
import { useActor } from "./useActor";

// ─── Profile ───────────────────────────────────────────────────────────────

export function useGetProfile(profileId: string | null) {
  const { actor } = useActor();
  // Only gate on actor existence — isFetching can flip true during re-fetches
  // which would incorrectly disable queries that are already ready to run.
  return useQuery<PatientProfile | null>({
    queryKey: ["profile", profileId],
    queryFn: async () => {
      if (!actor || !profileId) return null;
      const result = await actor.getProfile(profileId);
      return result;
    },
    enabled: !!actor && !!profileId,
    retry: 3,
    retryDelay: 1000,
  });
}

export function useCreateOrUpdateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: PatientProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.createOrUpdateProfile(profile);
    },
    onSuccess: (_data, profile) => {
      queryClient.invalidateQueries({
        queryKey: ["profile", profile.profileId],
      });
      queryClient.invalidateQueries({
        queryKey: ["medicalSummary", profile.profileId],
      });
    },
  });
}

// ─── Medical Summary ───────────────────────────────────────────────────────

export function useGetMedicalSummary(profileId: string | null) {
  const { actor } = useActor();
  return useQuery<MedicalSummary | null>({
    queryKey: ["medicalSummary", profileId],
    queryFn: async () => {
      if (!actor || !profileId) return null;
      return actor.getMedicalSummary(profileId);
    },
    enabled: !!actor && !!profileId,
    retry: 2,
    retryDelay: 1000,
  });
}

// ─── Medical Records ──────────────────────────────────────────────────────

export function useGetRecords(profileId: string | null) {
  const { actor } = useActor();
  return useQuery<MedicalRecord[]>({
    queryKey: ["records", profileId],
    queryFn: async () => {
      if (!actor || !profileId) return [];
      return actor.getRecordsByProfileId(profileId);
    },
    enabled: !!actor && !!profileId,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useAddMedicalRecord(profileId: string | null) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: MedicalRecord) => {
      if (!actor || !profileId)
        throw new Error("Actor or profileId not available");
      await actor.addMedicalRecord(profileId, record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records", profileId] });
    },
  });
}

export function useGetPublicRecords(profileId: string | null) {
  const { actor } = useActor();
  return useQuery<MedicalRecord[]>({
    queryKey: ["publicRecords", profileId],
    queryFn: async () => {
      if (!actor || !profileId) return [];
      return actor.getPublicRecordsByProfileId(profileId);
    },
    enabled: !!actor && !!profileId,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useDeleteMedicalRecord(profileId: string | null) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (recordId: string) => {
      if (!actor || !profileId)
        throw new Error("Actor or profileId not available");
      await actor.deleteMedicalRecord(profileId, recordId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records", profileId] });
    },
  });
}

export function useUpdateAiSummary(profileId: string | null) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (aiSummary: string) => {
      if (!actor || !profileId)
        throw new Error("Actor or profileId not available");
      await actor.updateAiSummary(profileId, aiSummary);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", profileId] });
    },
  });
}
