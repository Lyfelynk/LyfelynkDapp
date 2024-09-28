import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Map "mo:map/Map";

import IdentityManager "../IdentityManager/IdentityManager";
import Types "../Types";
import Hex "../utility/Hex";
import ProfessionalShardManager "ProfessionalShardManager";
actor ProfessionalService {
    type HealthIDProfessional = Types.HealthIDProfessional;
    type ProfessionalShardManager = ProfessionalShardManager.ProfessionalShardManager;

    let ShardManager : ProfessionalShardManager = actor ("a3shf-5eaaa-aaaaa-qaafa-cai"); // Professional Shard Manager Canister ID
    let identityManager : IdentityManager.IdentityManager = actor ("by6od-j4aaa-aaaaa-qaadq-cai"); // Replace with actual IdentityManager canister ID
    let vetkd_system_api : Types.VETKD_SYSTEM_API = actor ("cbopz-duaaa-aaaaa-qaaka-cai");

    private stable var pendingRequests : Map.Map<Principal, HealthIDProfessional> = Map.new<Principal, HealthIDProfessional>(); // Map of Pending Requests of Professionals Registered
    private stable var adminPrincipal = ""; // Admin Principal
    private var isAdminRegistered : Bool = false; // Admin Registration Status

    public shared ({ caller }) func createProfessionalRequest(demoInfo : Blob, occupationInfo : Blob, certificationInfo : Blob) : async Result.Result<Text, Text> {
        let tempProfessional : HealthIDProfessional = {
            IDNum = ""; // Will be assigned upon approval
            UUID = "";
            MetaData = {
                DemographicInformation = demoInfo;
                OccupationInformation = occupationInfo;
                CertificationInformation = certificationInfo;
            };
        };
        Map.set<Principal, Types.HealthIDProfessional>(pendingRequests, Map.phash, caller, tempProfessional);
        #ok("Your request for registration has been sucessful");
    };

    public shared ({ caller }) func getPendingProfessionalRequests() : async Result.Result<[(Principal, HealthIDProfessional)], Text> {
        // if (not isAdmin(caller)) {
        //     return #err("Unauthorized: only admins can view pending requests");
        // };
        #ok(Map.toArray(pendingRequests));
    };

    public shared ({ caller }) func approveProfessionalRequest(requestPrincipal : Principal) : async Result.Result<Text, Text> {
        // if (not isAdmin(caller)) {
        //     return #err("Unauthorized: only admins can approve requests");
        // };

        switch (Map.get(pendingRequests, Map.phash, requestPrincipal)) {
            case (null) { return #err("Invalid request principal") };
            case (?professional) {
                let idResult = await ShardManager.generateProfessionalID();
                let uuidResult = await ShardManager.generateUUID();
                switch (idResult) {
                    case (#ok(id)) {
                        let approvedProfessional : HealthIDProfessional = {
                            IDNum = id;
                            UUID = uuidResult;
                            MetaData = professional.MetaData;
                        };
                        let registerResult = await registerProfessional(id, approvedProfessional, requestPrincipal);
                        switch (registerResult) {
                            case (#ok(_)) {
                                Map.delete(pendingRequests, Map.phash, requestPrincipal);
                                let identityResult = await identityManager.registerIdentity(requestPrincipal, id, "Professional");
                                switch (identityResult) {
                                    case (#ok(_)) {
                                        #ok("Professional has been successfully approved");
                                    };
                                    case (#err(e)) {
                                        #err("Failed to register identity: " # e);
                                    };
                                };
                            };
                            case (#err(err)) {
                                #err("Failed to register professional: " # err);
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

    public shared ({ caller }) func rejectProfessionalRequest(requestPrincipal : Principal) : async Result.Result<Text, Text> {
        // if (not isAdmin(caller)) {
        //     return #err("Unauthorized: only admins can reject requests");
        // };

        switch (Map.get(pendingRequests, Map.phash, requestPrincipal)) {
            case (null) { return #err("Invalid request principal") };
            case (_) {
                Map.delete(pendingRequests, Map.phash, requestPrincipal);
                #ok("Sucessfully rejected the professional request");
            };
        };
    };

    public shared ({ caller }) func deleteProfessional() : async Result.Result<(), Text> {
        let professionalIDResult = await ShardManager.getProfessionalID(caller);
        switch (professionalIDResult) {
            case (#ok(id)) {
                let shardResult = await ShardManager.getShard(id);
                switch (shardResult) {
                    case (#ok(shard)) {
                        let deleteResult = await shard.deleteProfessional(id);
                        switch (deleteResult) {
                            case (#ok(_)) {
                                let removeIdentityResult = await identityManager.removeIdentity(id);
                                switch (removeIdentityResult) {
                                    case (#ok(_)) {
                                        let removeProfessionalResult = await ShardManager.removeProfessional(caller);
                                        switch (removeProfessionalResult) {
                                            case (#ok(_)) { #ok(()) };
                                            case (#err(e)) { #err(e) };
                                        };
                                    };
                                    case (#err(e)) { #err(e) };
                                };
                            };
                            case (#err(e)) { #err(e) };
                        };
                    };
                    case (#err(e)) { #err(e) };
                };
            };
            case (#err(_)) {
                #err("You're not registered as a Health Professional");
            };
        };
    };

    public shared ({ caller }) func getProfessionalStatus() : async Result.Result<Text, Text> {
        switch (Map.get(pendingRequests, Map.phash, caller)) {
            case (?_) { return #ok("Pending") };
            case (null) {
                let idResult = await ShardManager.getProfessionalID(caller);
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

    private func registerProfessional(id : Text, professional : HealthIDProfessional, requestPrincipal : Principal) : async Result.Result<(), Text> {

        let shardResult = await ShardManager.getShard(id);
        switch (shardResult) {
            case (#ok(shard)) {
                let result = await shard.insertProfessional(id, professional);
                switch (result) {
                    case (#ok(_)) {
                        ignore await ShardManager.registerProfessional(requestPrincipal, id);
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

    public shared ({ caller }) func getProfessionalInfo() : async Result.Result<HealthIDProfessional, Text> {
        let idResult = await ShardManager.getProfessionalID(caller);
        switch (idResult) {
            case (#ok(id)) {
                let shardResult = await ShardManager.getShard(id);
                switch (shardResult) {
                    case (#ok(shard)) {
                        let professionalResult = await shard.getProfessional(id);
                        switch (professionalResult) {
                            case (#ok(professional)) {
                                #ok(professional);
                            };
                            case (#err(e)) {
                                #err("Failed to get professional: " # e);
                            };
                        };
                    };
                    case (#err(e)) {
                        #err("Failed to get shard: " # e);
                    };
                };
            };
            case (#err(_)) {
                #err("You're not registered as a Health Professional");
            };
        };
    };

    public shared ({ caller }) func getProfessionalByID(id : Text) : async Result.Result<HealthIDProfessional, Text> {
        if (caller == caller) {
            //Admin Check to be added here
        };
        let shardResult = await ShardManager.getShard(id);

        switch (shardResult) {
            case (#ok(shard)) {
                let professionalResult = await shard.getProfessional(id);
                switch (professionalResult) {
                    case (#ok(professional)) {
                        #ok(professional);
                    };
                    case (#err(e)) {
                        #err("Failed to get professional: " # e);
                    };
                };
            };
            case (#err(e)) {
                #err("Failed to get shard: " # e);
            };
        };
    };

    public shared ({ caller }) func updateProfessionalInfo(demoInfo : Blob, occupationInfo : Blob, certificationInfo : Blob) : async Result.Result<(), Text> {
        let userIDResult = await ShardManager.getProfessionalID(caller);
        switch (userIDResult) {
            case (#ok(id)) {
                let shardResult = await ShardManager.getShard(id);
                switch (shardResult) {
                    case (#ok(shard)) {
                        let professionalResult = await shard.getProfessional(id);
                        switch (professionalResult) {
                            case (#ok(value)) {
                                let updatedProfessional : HealthIDProfessional = {
                                    IDNum = value.IDNum;
                                    UUID = value.UUID;
                                    MetaData = {
                                        DemographicInformation = demoInfo;
                                        OccupationInformation = occupationInfo;
                                        CertificationInformation = certificationInfo;
                                    };
                                };
                                ignore await shard.updateProfessional(id, updatedProfessional);
                                #ok(());
                            };
                            case (#err(err)) {
                                #err(err);
                            };
                        };
                    };
                    case (#err(e)) {
                        #err(e);
                    };
                };
            };
            case (#err(_)) {
                #err("You're not registered as a Health Professional");
            };
        };
    };

    public query func countPendingRequests() : async Nat {
        Map.size(pendingRequests);
    };

    // Function to get the caller's principal ID
    public shared query ({ caller }) func whoami() : async Text {
        Principal.toText(caller);
    };

    // Function to check if a principal is an admin
    public shared ({ caller }) func registerAdmin() : async Bool {
        if (Principal.isAnonymous(caller) or isAdminRegistered) {
            return false;
        };
        adminPrincipal := Principal.toText(caller);
        isAdminRegistered := true;
        return true;
    };
    // Helper function to check if a principal is an admin
    private func isAdmin(principal : Principal) : Bool {
        // Check if the provided principal matches the admin principal
        Principal.toText(principal) == adminPrincipal;

    };

    public shared ({ caller }) func updateProfessionalShardWasmModule(wasmModule : [Nat8]) : async Result.Result<(), Text> {

        // if (isAdmin(caller)) {
        // Call the updateWasmModule function of the ProfessionalShardManager
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

    public shared ({ caller }) func encrypted_symmetric_key_for_professional(encryption_public_key : Blob) : async Result.Result<Text, Text> {
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
