import Array "mo:base/Array";
import Error "mo:base/Error";
import Cycles "mo:base/ExperimentalCycles";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat8 "mo:base/Nat8";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import BTree "mo:stableheapbtreemap/BTree";
import Source "mo:uuid/async/SourceV4";
import UUID "mo:uuid/UUID";

import Interface "../utility/ic-management-interface";
import FacilityShard "FacilityShard";

actor class FacilityShardManager() {
    private stable var totalFacilityCount : Nat = 0;
    private stable var shardCount : Nat = 0;
    private let FACILITIES_PER_SHARD : Nat = 20_480;
    private let STARTING_FACILITY_ID : Nat = 20_000_000_000_000;
    private stable let shards : BTree.BTree<Text, Principal> = BTree.init<Text, Principal>(null);
    private stable var facilityShardMap : BTree.BTree<Principal, Text> = BTree.init<Principal, Text>(null);
    private stable var reverseFacilityShardMap : BTree.BTree<Text, Principal> = BTree.init<Text, Principal>(null);
    private stable var facilityShardWasmModule : [Nat8] = [];

    private let IC = "aaaaa-aa";
    private let ic : Interface.Self = actor (IC);

    private stable var adminPrincipal = "";

    private func isAdmin(caller : Principal) : Bool {
        return true;
    };

    public func generateFacilityID() : async Result.Result<Text, Text> {
        #ok(Nat.toText(STARTING_FACILITY_ID + totalFacilityCount));
    };

    public func generateUUID() : async Text {
        let g = Source.Source();
        UUID.toText(await g.new());
    };

    private func getShardID(facilityID : Text) : Text {
        switch (Nat.fromText(facilityID)) {
            case (?value) {
                if (value >= STARTING_FACILITY_ID) {
                    let shardIndex = (value - STARTING_FACILITY_ID) / FACILITIES_PER_SHARD;
                    return Nat.toText(shardIndex);
                };
                return ("not a valid Facility ID");
            };
            case (null) { return ("not a valid Facility ID") };
        };
    };

    public func getShard(facilityID : Text) : async Result.Result<FacilityShard.FacilityShard, Text> {
        if (shardCount == 0 or totalFacilityCount >= shardCount * FACILITIES_PER_SHARD) {
            let newShardResult = await createShard();
            switch (newShardResult) {
                case (#ok(newShardPrincipal)) {
                    let newShardID = getShardID(facilityID);
                    ignore BTree.insert(shards, Text.compare, newShardID, newShardPrincipal);
                    shardCount += 1;
                    return #ok(actor (Principal.toText(newShardPrincipal)) : FacilityShard.FacilityShard);
                };
                case (#err(e)) {
                    return #err(e);
                };
            };
        };

        let shardID = getShardID(facilityID);
        switch (BTree.get(shards, Text.compare, shardID)) {
            case (?principal) {
                #ok(actor (Principal.toText(principal)) : FacilityShard.FacilityShard);
            };
            case null {
                #err("Shard not found for facility ID: " # facilityID);
            };
        };
    };

    public func registerFacility(caller : Principal, facilityID : Text) : async Result.Result<(), Text> {
        switch (BTree.get(facilityShardMap, Principal.compare, caller)) {
            case (?_) {
                #err("Facility already registered");
            };
            case null {
                ignore BTree.insert(facilityShardMap, Principal.compare, caller, facilityID);
                ignore BTree.insert(reverseFacilityShardMap, Text.compare, facilityID, caller);
                totalFacilityCount += 1;
                #ok(());
            };
        };
    };

    public func getFacilityID(caller : Principal) : async Result.Result<Text, Text> {
        switch (BTree.get(facilityShardMap, Principal.compare, caller)) {
            case (?facilityID) {
                #ok(facilityID);
            };
            case null {
                #err("Facility ID not found for the given principal");
            };
        };
    };

    public func getFacilityPrincipalByID(facilityID : Text) : async Result.Result<Principal, Text> {
        switch (BTree.get(reverseFacilityShardMap, Text.compare, facilityID)) {
            case (?principal) {
                #ok(principal);
            };
            case null {
                #err("Facility not found");
            };
        };
    };

    public func removeFacility(caller : Principal) : async Result.Result<(), Text> {
        switch (BTree.get(facilityShardMap, Principal.compare, caller)) {
            case (?facilityID) {
                ignore BTree.delete(facilityShardMap, Principal.compare, caller);
                ignore BTree.delete(reverseFacilityShardMap, Text.compare, facilityID);
                totalFacilityCount -= 1;
                #ok(());
            };
            case null {
                #err("Facility not found");
            };
        };
    };

    private func createShard() : async Result.Result<Principal, Text> {
        if (Array.size(facilityShardWasmModule) == 0) {
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
                wasm_module = facilityShardWasmModule;
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

        facilityShardWasmModule := wasmModule;
        #ok(());
    };

    public query func getTotalFacilityCount() : async Nat {
        totalFacilityCount;
    };

    public query func getShardCount() : async Nat {
        shardCount;
    };

    public query func getFacilitiesPerShard() : async Nat {
        FACILITIES_PER_SHARD;
    };
};
