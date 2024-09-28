import Array "mo:base/Array";
import Error "mo:base/Error";
import Cycles "mo:base/ExperimentalCycles";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import BTree "mo:stableheapbtreemap/BTree";
import Source "mo:uuid/async/SourceV4";
import UUID "mo:uuid/UUID";

import Interface "../utility/ic-management-interface";
import ProfessionalShard "ProfessionalShard";

actor class ProfessionalShardManager() {
    private stable var totalProfessionalCount : Nat = 0;
    private stable var shardCount : Nat = 0;
    private let PROFESSIONALS_PER_SHARD : Nat = 20_480;
    private let STARTING_PROFESSIONAL_ID : Nat = 10_000_000_000_000;
    private stable let shards : BTree.BTree<Text, Principal> = BTree.init<Text, Principal>(null); // Map of Shard ID to Shard Principal
    private stable var professionalShardMap : BTree.BTree<Principal, Text> = BTree.init<Principal, Text>(null); // Map of Professional Principal to Professional ID
    private stable var reverseProfessionalShardMap : BTree.BTree<Text, Principal> = BTree.init<Text, Principal>(null); // Map of Professional ID to Professional Principal
    private stable var professionalShardWasmModule : [Nat8] = []; // Wasm Module for Shards

    private let IC = "aaaaa-aa";
    private let ic : Interface.Self = actor (IC);

    private stable var admins : [Principal] = [/* list of admin principals */];

    private func isAdmin(caller : Principal) : Bool {
        Array.find<Principal>(admins, func(p) { p == caller }) != null;
    };

    public func generateProfessionalID() : async Result.Result<Text, Text> {
        #ok(Nat.toText(STARTING_PROFESSIONAL_ID + totalProfessionalCount));
    };

    public func generateUUID() : async Text {
        let g = Source.Source();
        (UUID.toText(await g.new()));
    };

    private func getShardID(professionalID : Text) : Text {
        switch (Nat.fromText(professionalID)) {
            case (?value) {
                if (value >= STARTING_PROFESSIONAL_ID) {

                    let shardIndex = (value - STARTING_PROFESSIONAL_ID) / PROFESSIONALS_PER_SHARD;
                    return "professional-shard-" # Nat.toText(shardIndex);
                };
                return ("not a valid Professional ID");
            };
            case (null) { return ("not a valid Professional ID") };
        };
    };

    public func getShard(professionalID : Text) : async Result.Result<ProfessionalShard.ProfessionalShard, Text> {
        if (shardCount == 0 or totalProfessionalCount >= shardCount * PROFESSIONALS_PER_SHARD) {
            let newShardResult = await createShard();
            switch (newShardResult) {
                case (#ok(newShardPrincipal)) {
                    let newShardID = "professional-shard-" # Nat.toText(shardCount);
                    ignore BTree.insert(shards, Text.compare, newShardID, newShardPrincipal);
                    shardCount += 1;
                    return #ok(actor (Principal.toText(newShardPrincipal)) : ProfessionalShard.ProfessionalShard);
                };
                case (#err(e)) {
                    return #err(e);
                };
            };
        };

        let shardID = getShardID(professionalID);
        switch (BTree.get(shards, Text.compare, shardID)) {
            case (?principal) {
                #ok(actor (Principal.toText(principal)) : ProfessionalShard.ProfessionalShard);
            };
            case null {
                #err("Shard not found for professional ID: " # professionalID);
            };
        };
    };

    public func registerProfessional(caller : Principal, professionalID : Text) : async Result.Result<(), Text> {
        switch (BTree.get(professionalShardMap, Principal.compare, caller)) {
            case (?_) {
                #err("Professional already registered");
            };
            case null {
                ignore BTree.insert(professionalShardMap, Principal.compare, caller, professionalID);
                ignore BTree.insert(reverseProfessionalShardMap, Text.compare, professionalID, caller);
                totalProfessionalCount += 1;
                #ok(());
            };
        };
    };

    public func getProfessionalID(caller : Principal) : async Result.Result<Text, Text> {
        switch (BTree.get(professionalShardMap, Principal.compare, caller)) {
            case (?professionalID) {
                #ok(professionalID);
            };
            case null {
                #err("Professional ID not found for the given principal");
            };
        };
    };

    public func getProfessionalPrincipal(professionalID : Text) : async Result.Result<Principal, Text> {
        switch (BTree.get(reverseProfessionalShardMap, Text.compare, professionalID)) {
            case (?principal) {
                #ok(principal);
            };
            case null {
                #err("Professional not found");
            };
        };
    };
    public func removeProfessional(caller : Principal) : async Result.Result<(), Text> {
        switch (BTree.get(professionalShardMap, Principal.compare, caller)) {
            case (?professionalID) {
                ignore BTree.delete(professionalShardMap, Principal.compare, caller);
                ignore BTree.delete(reverseProfessionalShardMap, Text.compare, professionalID);
                totalProfessionalCount -= 1;
                #ok(());
            };
            case null {
                #err("Professional not found");
            };
        };
    };

    private func createShard() : async Result.Result<Principal, Text> {
        if (Array.size(professionalShardWasmModule) == 0) {
            return #err("Wasm module not set. Please update the Wasm module first.");
        };

        try {
            let cycles = 10 ** 12;
            Cycles.add<system>(cycles);
            let newCanister = await ic.create_canister({ settings = null });
            let canisterPrincipal = newCanister.canister_id;

            let installResult = await installCodeOnShard(canisterPrincipal);
            switch (installResult) {
                case (#ok(())) {
                    #ok(canisterPrincipal);
                };
                case (#err(e)) {
                    #err(e);
                };
            };
        } catch (e) {
            #err("Failed to create shard: " # Error.message(e));
        };
    };

    private func installCodeOnShard(canisterPrincipal : Principal) : async Result.Result<(), Text> {
        let arg = [];

        try {
            await ic.install_code({
                arg = arg;
                wasm_module = professionalShardWasmModule;
                mode = #install;
                canister_id = canisterPrincipal;
            });

            await ic.start_canister({ canister_id = canisterPrincipal });
            #ok(());
        } catch (e) {
            #err("Failed to install or start code on shard: " # Error.message(e));
        };
    };

    public shared ({ caller }) func updateWasmModule(wasmModule : [Nat8]) : async Result.Result<(), Text> {
        if (Array.size(wasmModule) < 8) {
            return #err("Invalid WASM module: too small");
        };

        professionalShardWasmModule := wasmModule;
        #ok(());
    };

    public query func getTotalProfessionalCount() : async Nat {
        totalProfessionalCount;
    };

    public query func getShardCount() : async Nat {
        shardCount;
    };

    public query func getProfessionalsPerShard() : async Nat {
        PROFESSIONALS_PER_SHARD;
    };
};
