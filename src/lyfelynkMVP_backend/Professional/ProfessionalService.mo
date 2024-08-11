import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Map "mo:map/Map";

import Types "../Types";
import ProfessionalShardManager "ProfessionalShardManager";

actor ProfessionalService {
    type HealthIDProfessional = Types.HealthIDProfessional;
    type ProfessionalShardManager = ProfessionalShardManager.ProfessionalShardManager;

    let ShardManager : ProfessionalShardManager = actor ("bkyz2-fmaaa-aaaaa-qaaaq-cai"); // Replace with actual canister ID

    private stable var pendingRequests : Map.Map<Principal, HealthIDProfessional> = Map.new<Principal, HealthIDProfessional>();
    private stable var admins : [Principal] = [/* list of admin principals */];

    public shared ({ caller }) func createProfessionalRequest(demoInfo : Blob, occupationInfo : Blob, certificationInfo : Blob) : async Result.Result<Text, Text> {
        let tempProfessional : HealthIDProfessional = {
            IDNum = ""; // Will be assigned upon approval
            UUID = Principal.toText(caller);
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
        if (not isAdmin(caller)) {
            return #err("Unauthorized: only admins can view pending requests");
        };
        #ok(Map.toArray(pendingRequests));
    };

    public shared ({ caller }) func approveProfessionalRequest(requestPrincipal : Principal) : async Result.Result<Text, Text> {
        if (not isAdmin(caller)) {
            return #err("Unauthorized: only admins can approve requests");
        };

        switch (Map.get(pendingRequests, Map.phash, requestPrincipal)) {
            case (null) { return #err("Invalid request principal") };
            case (?professional) {
                let idResult = await ShardManager.generateProfessionalID();

                switch (idResult) {
                    case (#ok(id)) {
                        let approvedProfessional : HealthIDProfessional = {
                            IDNum = id;
                            UUID = professional.UUID;
                            MetaData = professional.MetaData;
                        };
                        let registerResult = await registerProfessional(id, approvedProfessional);
                        switch (registerResult) {
                            case (#ok(_)) {
                                Map.delete(pendingRequests, Map.phash, requestPrincipal);
                                #ok("Professional has been successfully approved");
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
        if (not isAdmin(caller)) {
            return #err("Unauthorized: only admins can reject requests");
        };

        switch (Map.get(pendingRequests, Map.phash, requestPrincipal)) {
            case (null) { return #err("Invalid request principal") };
            case (_) {
                Map.delete(pendingRequests, Map.phash, requestPrincipal);
                #ok("Sucessfully rejected the professional request");
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

    private func registerProfessional(id : Text, professional : HealthIDProfessional) : async Result.Result<(), Text> {

        let shardResult = await ShardManager.getShard(id);
        switch (shardResult) {
            case (#ok(shard)) {
                let result = await shard.insertProfessional(id, professional);
                switch (result) {
                    case (#ok(_)) {
                        ignore await ShardManager.registerProfessional(Principal.fromText(professional.UUID), id);
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

    public shared ({ caller }) func getProfessionalByID(id : Text) : async Result.Result<HealthIDProfessional, Text> {
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

    public shared ({ caller }) func whoami() : async Text {
        Principal.toText(caller);
    };
    // Function to check if a principal is an admin
    private func isAdmin(principal : Principal) : Bool {
        Option.isSome(Array.find(admins, func(p : Principal) : Bool { p == principal }));
    };
    public shared ({ caller }) func addAdmin(newAdmin : Principal) : async Result.Result<(), Text> {
        if (not isAdmin(caller)) {
            return #err("Unauthorized: only admins can add new admins");
        };
        admins := Array.append(admins, [newAdmin]);
        #ok(());
    };

    public shared ({ caller }) func removeAdmin(adminToRemove : Principal) : async Result.Result<(), Text> {
        if (not isAdmin(caller)) {
            return #err("Unauthorized: only admins can remove admins");
        };
        admins := Array.filter(admins, func(p : Principal) : Bool { p != adminToRemove });
        #ok(());
    };
};
