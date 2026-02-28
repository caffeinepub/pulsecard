import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface MedicalRecord {
    id: string;
    title: string;
    description: string;
    fileType: FileType;
    uploadDate: bigint;
    blobReference: ExternalBlob;
}
export interface PatientProfile {
    bloodType: string;
    dateOfBirth: string;
    name: string;
    profileId: string;
    medications: Array<string>;
    emergencyContactPhone: string;
    conditions: Array<string>;
    aiSummary: string;
    emergencyContactName: string;
    allergies: Array<string>;
}
export interface MedicalSummary {
    bloodType: string;
    name: string;
    emergencyContactPhone: string;
    conditions: Array<string>;
    emergencyContactName: string;
    allergies: Array<string>;
}
export enum FileType {
    pdf = "pdf",
    audio = "audio",
    other = "other",
    video = "video",
    image = "image"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addMedicalRecord(profileId: string, record: MedicalRecord): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    convertMedicalProfileToPatientProfile(profileId: string, dateOfBirth: string, medications: Array<string>, aiSummary: string): Promise<PatientProfile>;
    createOrUpdateProfile(profile: PatientProfile): Promise<void>;
    deleteMedicalRecord(profileId: string, recordId: string): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    getMedicalSummary(profileId: string): Promise<MedicalSummary | null>;
    getProfile(profileId: string): Promise<PatientProfile | null>;
    getPublicRecordsByProfileId(profileId: string): Promise<Array<MedicalRecord>>;
    getRecordsByProfileId(profileId: string): Promise<Array<MedicalRecord>>;
    isCallerAdmin(): Promise<boolean>;
    updateAiSummary(profileId: string, aiSummary: string): Promise<void>;
}
