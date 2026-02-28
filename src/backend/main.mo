import Array "mo:core/Array";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Set "mo:core/Set";
import Int "mo:core/Int";

actor {
  include MixinStorage();

  module MedicalRecord {
    public type FileType = {
      #pdf;
      #image;
      #audio;
      #video;
      #other;
    };

    public func compareByDate(r1 : MedicalRecord, r2 : MedicalRecord) : Order.Order {
      Int.compare(r1.uploadDate, r2.uploadDate);
    };
  };

  public type MedicalRecord = {
    id : Text;
    title : Text;
    description : Text;
    fileType : MedicalRecord.FileType;
    uploadDate : Int;
    blobReference : Storage.ExternalBlob;
  };

  public type MedicalSummary = {
    name : Text;
    bloodType : Text;
    allergies : [Text];
    conditions : [Text];
    emergencyContactName : Text;
    emergencyContactPhone : Text;
  };

  public type PatientProfile = {
    name : Text;
    dateOfBirth : Text;
    bloodType : Text;
    allergies : [Text];
    conditions : [Text];
    medications : [Text];
    emergencyContactName : Text;
    emergencyContactPhone : Text;
    profileId : Text;
    aiSummary : Text;
  };

  let profiles = Map.empty<Text, PatientProfile>();
  let medicalRecords = Map.empty<Text, List.List<MedicalRecord>>();
  let profileOwners = Map.empty<Text, Principal>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public query ({ caller }) func getMedicalSummary(profileId : Text) : async ?MedicalSummary {
    switch (profiles.get(profileId)) {
      case (null) { null };
      case (?profile) {
        ?{
          name = profile.name;
          bloodType = profile.bloodType;
          allergies = profile.allergies;
          conditions = profile.conditions;
          emergencyContactName = profile.emergencyContactName;
          emergencyContactPhone = profile.emergencyContactPhone;
        };
      };
    };
  };

  public shared ({ caller }) func createOrUpdateProfile(profile : PatientProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update profiles");
    };

    switch (profileOwners.get(profile.profileId)) {
      case (null) {
        profileOwners.add(profile.profileId, caller);
      };
      case (?owner) {
        if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own profile");
        };
      };
    };

    profiles.add(profile.profileId, profile);

    if (not medicalRecords.containsKey(profile.profileId)) {
      medicalRecords.add(profile.profileId, List.empty<MedicalRecord>());
    };
  };

  public query ({ caller }) func getProfile(profileId : Text) : async ?PatientProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view full profiles");
    };

    switch (profileOwners.get(profileId)) {
      case (null) { null };
      case (?owner) {
        if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own profile");
        };
        profiles.get(profileId);
      };
    };
  };

  public shared ({ caller }) func addMedicalRecord(profileId : Text, record : MedicalRecord) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add medical records");
    };

    switch (profileOwners.get(profileId)) {
      case (null) {
        Runtime.trap("Unauthorized: Profile not found");
      };
      case (?owner) {
        if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only add records to your own profile");
        };
      };
    };

    let currentRecords = switch (medicalRecords.get(profileId)) {
      case (null) { List.empty<MedicalRecord>() };
      case (?records) { records };
    };
    currentRecords.add(record);
    medicalRecords.add(profileId, currentRecords);
  };

  public shared ({ caller }) func deleteMedicalRecord(profileId : Text, recordId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete medical records");
    };

    switch (profileOwners.get(profileId)) {
      case (null) {
        Runtime.trap("Unauthorized: Profile not found");
      };
      case (?owner) {
        if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete records from your own profile");
        };
      };
    };

    switch (medicalRecords.get(profileId)) {
      case (null) {
        Runtime.trap("Record not found for this profile ID");
      };
      case (?records) {
        let updatedRecords = records.filter(
          func(record) {
            record.id != recordId;
          }
        );
        medicalRecords.add(profileId, updatedRecords);
      };
    };
  };

  public query ({ caller }) func getRecordsByProfileId(profileId : Text) : async [MedicalRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view full records");
    };

    switch (profileOwners.get(profileId)) {
      case (null) { [] };
      case (?owner) {
        if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own medical records");
        };

        switch (medicalRecords.get(profileId)) {
          case (null) { [] };
          case (?records) {
            records.toArray().sort(MedicalRecord.compareByDate);
          };
        };
      };
    };
  };

  public shared ({ caller }) func updateAiSummary(profileId : Text, aiSummary : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update AI summary");
    };

    switch (profileOwners.get(profileId)) {
      case (null) {
        Runtime.trap("Unauthorized: Profile not found");
      };
      case (?owner) {
        if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own AI summary");
        };
      };
    };

    switch (profiles.get(profileId)) {
      case (null) {
        Runtime.trap("Profile not found");
      };
      case (?profile) {
        let updatedProfile : PatientProfile = {
          name = profile.name;
          dateOfBirth = profile.dateOfBirth;
          bloodType = profile.bloodType;
          allergies = profile.allergies;
          conditions = profile.conditions;
          medications = profile.medications;
          emergencyContactName = profile.emergencyContactName;
          emergencyContactPhone = profile.emergencyContactPhone;
          profileId = profile.profileId;
          aiSummary;
        };
        profiles.add(profileId, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func convertMedicalProfileToPatientProfile(
    profileId : Text,
    dateOfBirth : Text,
    medications : [Text],
    aiSummary : Text,
  ) : async PatientProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can convert profiles");
    };

    switch (profileOwners.get(profileId)) {
      case (null) {
        Runtime.trap("Unauthorized: Profile not found");
      };
      case (?owner) {
        if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only convert your own profile");
        };
      };
    };

    let medicalSummary = switch (profiles.get(profileId)) {
      case (null) {
        Runtime.trap("Profile not found");
      };
      case (?profile) {
        {
          name = profile.name;
          bloodType = profile.bloodType;
          allergies = profile.allergies;
          conditions = profile.conditions;
          emergencyContactName = profile.emergencyContactName;
          emergencyContactPhone = profile.emergencyContactPhone;
        };
      };
    };
    let patientProfile = {
      medicalSummary with
      dateOfBirth;
      medications;
      aiSummary;
      profileId;
    };
    patientProfile;
  };
};
