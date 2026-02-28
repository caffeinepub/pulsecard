import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MedicalRecord, MedicalSummary, PatientProfile } from "../backend";
import { useActor } from "./useActor";

// ─── Profile ───────────────────────────────────────────────────────────────

export function useGetProfile(profileId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<PatientProfile | null>({
    queryKey: ["profile", profileId],
    queryFn: async () => {
      if (!actor || !profileId) return null;
      return actor.getProfile(profileId);
    },
    enabled: !!actor && !isFetching && !!profileId,
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
  const { actor, isFetching } = useActor();
  return useQuery<MedicalSummary | null>({
    queryKey: ["medicalSummary", profileId],
    queryFn: async () => {
      if (!actor || !profileId) return null;
      return actor.getMedicalSummary(profileId);
    },
    enabled: !!actor && !isFetching && !!profileId,
  });
}

// ─── Medical Records ──────────────────────────────────────────────────────

export function useGetRecords(profileId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<MedicalRecord[]>({
    queryKey: ["records", profileId],
    queryFn: async () => {
      if (!actor || !profileId) return [];
      return actor.getRecordsByProfileId(profileId);
    },
    enabled: !!actor && !isFetching && !!profileId,
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
