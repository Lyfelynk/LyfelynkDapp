import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Bool "mo:base/Bool";
import Buffer "mo:base/Buffer";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Map "mo:map/Map";

import IdentityManager "../IdentityManager/IdentityManager";
import Types "../Types";
import Hex "../utility/Hex";
import FacilityShardManager "FacilityShardManager";
actor FacilityService {
    type HealthIDFacility = Types.HealthIDFacility;
    type FacilityShardManager = FacilityShardManager.FacilityShardManager;
    let identityManager : IdentityManager.IdentityManager = actor (Types.identityManagerCanisterID); // Replace with actual IdentityManager canister ID
    let ShardManager : FacilityShardManager = actor (Types.facilityShardManagerCanisterID); // Facility Shard Manager Canister ID
    let vetkd_system_api : Types.VETKD_SYSTEM_API = actor (Types.vetkdSystemCanisterID); // VetKey System API Canister ID

    private stable var pendingRequests : Map.Map<Principal, HealthIDFacility> = Map.new<Principal, HealthIDFacility>(); // Map of pending requests
    private stable var adminPrincipal = ""; // Admin Principal
    private stable var isAdminRegistered = false; // Admin Registration Status

    public shared ({ caller }) func createFacilityRequest(facilityInfo : Blob, licenseInfo : Blob, demographicInfo : Blob, servicesOfferedInfo : Blob) : async Result.Result<Text, Text> {
        let tempFacility : HealthIDFacility = {
            IDNum = ""; // Will be assigned upon approval
            UUID = Principal.toText(caller);
            MetaData = {
                FacilityInformation = facilityInfo;
                LicenseInformation = licenseInfo;
                DemographicInformation = demographicInfo;
                ServicesOfferedInformation = servicesOfferedInfo;
            };
        };
        Map.set<Principal, Types.HealthIDFacility>(pendingRequests, Map.phash, caller, tempFacility);
        #ok("Your request for facility registration has been successful");
    };

    public shared ({ caller }) func getPendingFacilityRequests() : async Result.Result<[(Principal, HealthIDFacility)], Text> {
        if (not isAdmin(caller)) {
            return #err("Unauthorized: only admins can view pending requests");
        };
        #ok(Map.toArray(pendingRequests));
    };

    public shared ({ caller }) func approveFacilityRequest(requestPrincipal : Principal) : async Result.Result<Text, Text> {
        if (not isAdmin(caller)) {
            return #err("Unauthorized: only admins can approve requests");
        };

        switch (Map.get(pendingRequests, Map.phash, requestPrincipal)) {
            case (null) { return #err("Invalid request principal") };
            case (?facility) {
                let idResult = await ShardManager.generateFacilityID();
                let uuidResult = await ShardManager.generateUUID();

                switch (idResult) {
                    case (#ok(id)) {
                        let approvedFacility : HealthIDFacility = {
                            IDNum = id;
                            UUID = uuidResult;
                            MetaData = facility.MetaData;
                        };
                        let registerResult = await registerFacility(id, approvedFacility, requestPrincipal);
                        switch (registerResult) {
                            case (#ok(_)) {
                                Map.delete(pendingRequests, Map.phash, requestPrincipal);
                                let identityResult = await identityManager.registerIdentity(requestPrincipal, id, "Facility");
                                switch (identityResult) {
                                    case (#ok(_)) {
                                        #ok("Facility has been successfully approved");
                                    };
                                    case (#err(e)) {
                                        #err("Failed to register identity: " # e);
                                    };
                                };
                            };
                            case (#err(err)) {
                                #err("Failed to register facility: " # err);
                            };
                        };
                    };
                    case (#err(err)) {
                        #err("Failed to generate ID: " # err);
                    };
                };
            };
        };
    };

    public shared ({ caller }) func rejectFacilityRequest(requestPrincipal : Principal) : async Result.Result<Text, Text> {
        if (not isAdmin(caller)) {
            return #err("Unauthorized: only admins can reject requests");
        };

        switch (Map.get(pendingRequests, Map.phash, requestPrincipal)) {
            case (null) { return #err("Invalid request principal") };
            case (_) {
                Map.delete(pendingRequests, Map.phash, requestPrincipal);
                #ok("Successfully rejected the facility request");
            };
        };
    };

    public shared ({ caller }) func getFacilityStatus() : async Result.Result<Text, Text> {
        switch (Map.get(pendingRequests, Map.phash, caller)) {
            case (?_) { return #ok("Pending") };
            case (null) {
                let idResult = await ShardManager.getFacilityID(caller);
                switch (idResult) {
                    case (#ok(_)) {
                        #ok("Approved");
                    };
                    case (#err(_)) {
                        #ok("Not Registered");
                    };
                };
            };
        };
    };

    private func registerFacility(id : Text, facility : HealthIDFacility, requestPrincipal : Principal) : async Result.Result<(), Text> {
        let shardResult = await ShardManager.getShard(id);
        switch (shardResult) {
            case (#ok(shard)) {
                let result = await shard.insertFacility(id, facility);
                switch (result) {
                    case (#ok(_)) {
                        ignore await ShardManager.registerFacility(requestPrincipal, id);
                        #ok(());
                    };
                    case (#err(err)) {
                        #err(err);
                    };
                };
            };
            case (#err(err)) {
                #err(err);
            };
        };
    };
    public shared ({ caller }) func updateFacility(facilityInfo : Blob, licenseInfo : Blob) : async Result.Result<Text, Text> {
        let idResult = await ShardManager.getFacilityID(caller);
        switch (idResult) {
            case (#ok(id)) {
                let shardResult = await ShardManager.getShard(id);
                switch (shardResult) {
                    case (#ok(shard)) {
                        let facilityResult = await shard.getFacility(id);
                        switch (facilityResult) {
                            case (#ok(facility)) {
                                let updatedFacility : HealthIDFacility = {
                                    IDNum = facility.IDNum;
                                    UUID = facility.UUID;
                                    MetaData = {
                                        FacilityInformation = facilityInfo;
                                        LicenseInformation = licenseInfo;
                                        DemographicInformation = facility.MetaData.DemographicInformation;
                                        ServicesOfferedInformation = facility.MetaData.ServicesOfferedInformation;
                                    };
                                };
                                let updateResult = await shard.updateFacility(id, updatedFacility);
                                switch (updateResult) {
                                    case (#ok(_)) {
                                        #ok("Facility updated successfully");
                                    };
                                    case (#err(err)) {
                                        #err("Failed to update facility: " # err);
                                    };
                                };
                            };
                            case (#err(err)) {
                                #err("Failed to get facility: " # err);
                            };
                        };
                    };
                    case (#err(err)) { #err("Failed to get shard: " # err) };
                };
            };
            case (#err(_)) {
                #err("Facility not found for the given principal");
            };
        };
    };

    public shared ({ caller }) func deleteFacility() : async Result.Result<(), Text> {
        let idResult = await ShardManager.getFacilityID(caller);
        switch (idResult) {
            case (#ok(id)) {
                let shardResult = await ShardManager.getShard(id);
                switch (shardResult) {
                    case (#ok(shard)) {
                        let deleteResult = await shard.deleteFacility(id);
                        switch (deleteResult) {
                            case (#ok(_)) {
                                let identityResult = await identityManager.removeIdentity(id);
                                switch (identityResult) {
                                    case (#ok(_)) {
                                        ignore await ShardManager.removeFacility(caller);
                                        #ok(());
                                    };
                                    case (#err(e)) {
                                        #err("Failed to delete identity: " # e);
                                    };
                                };
                            };
                            case (#err(err)) {
                                #err("Failed to delete facility: " # err);
                            };
                        };
                    };
                    case (#err(err)) { #err("Failed to get shard: " # err) };
                };
            };
            case (#err(_)) {
                #err("Facility not found for the given principal");
            };
        };
    };

    public shared ({ caller }) func getFacilityInfo() : async Result.Result<HealthIDFacility, Text> {
        let idResult = await ShardManager.getFacilityID(caller);
        switch (idResult) {
            case (#ok(id)) {
                let shardResult = await ShardManager.getShard(id);
                switch (shardResult) {
                    case (#ok(shard)) {
                        await shard.getFacility(id);
                    };
                    case (#err(err)) { #err("Failed to get shard: " # err) };
                };
            };
            case (#err(_)) {
                #err("Facility not found for the given principal");
            };
        };
    };

    private func isAdmin(principal : Principal) : Bool {
        adminPrincipal == Principal.toText(principal);
    };

    public shared ({ caller }) func registerAdmin() : async Bool {
        if (isAdminRegistered or Principal.isAnonymous(caller)) {
            return false;
        };
        adminPrincipal := Principal.toText(caller);
        isAdminRegistered := true;
        true;
    };

    // Function to get the caller's principal ID
    public shared query ({ caller }) func whoami() : async Text {
        Principal.toText(caller);
    };

    public shared ({ caller }) func updateFacilityShardWasmModule(wasmModule : [Nat8]) : async Result.Result<(), Text> {

        // if (isAdmin(caller)) {
        // Call the updateWasmModule function of the FacilityShardManager
        let result = await ShardManager.updateWasmModule(wasmModule);

        switch (result) {
            case (#ok(())) {
                #ok(());
            };
            case (#err(e)) {
                #err("Failed to update WASM module: " # e);
            };
        };
        // } else {
        //     #err("You don't have permission to perform this action");
        // };

    };

    //VetKey Section

    public func symmetric_key_verification_key() : async Text {
        let { public_key } = await vetkd_system_api.vetkd_public_key({
            canister_id = null;
            derivation_path = Array.make(Text.encodeUtf8("symmetric_key"));
            key_id = { curve = #bls12_381; name = "test_key_1" };
        });
        Hex.encode(Blob.toArray(public_key));
    };

    public shared ({ caller }) func encrypted_symmetric_key_for_facility(encryption_public_key : Blob) : async Result.Result<Text, Text> {
        if (Principal.isAnonymous(caller)) {
            return #err("Please log in with a wallet or internet identity.");
        };

        let buf = Buffer.Buffer<Nat8>(32);
        buf.append(Buffer.fromArray(Blob.toArray(Text.encodeUtf8(Principal.toText(caller)))));
        let derivation_id = Blob.fromArray(Buffer.toArray(buf));

        let { encrypted_key } = await vetkd_system_api.vetkd_encrypted_key({
            derivation_id;
            public_key_derivation_path = Array.make(Text.encodeUtf8("symmetric_key"));
            key_id = { curve = #bls12_381; name = "test_key_1" };
            encryption_public_key;
        });

        #ok(Hex.encode(Blob.toArray(encrypted_key)));
    };
};
