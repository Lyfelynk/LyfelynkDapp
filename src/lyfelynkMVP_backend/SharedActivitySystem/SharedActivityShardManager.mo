import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Error "mo:base/Error";
import Cycles "mo:base/ExperimentalCycles";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import BTree "mo:stableheapbtreemap/BTree";

import Interface "../utility/ic-management-interface";
import SharedActivityShard "SharedActivityShard";

actor class SharedActivityShardManager() {
    private stable var totalActivityCount : Nat = 0;
    private stable var shardCount : Nat = 0;
    private let ACTIVITIES_PER_SHARD : Nat = 200_000;
    private stable let shards : BTree.BTree<Text, Principal> = BTree.init<Text, Principal>(null);
    private stable var sharedActivityShardWasmModule : [Nat8] = [];

    private stable var userShardMap : BTree.BTree<Text, [Text]> = BTree.init<Text, [Text]>(null);

    private let IC = "aaaaa-aa";
    private let ic : Interface.Self = actor (IC);

    public func getShard(activityID : Text) : async Result.Result<SharedActivityShard.SharedActivityShard, Text> {
        let shardID = getShardID(activityID);
        switch (BTree.get(shards, Text.compare, shardID)) {
            case (?principal) {
                #ok(actor (Principal.toText(principal)) : SharedActivityShard.SharedActivityShard);
            };
            case null {
                let newShardResult = await createShard();
                switch (newShardResult) {
                    case (#ok(newShardPrincipal)) {
                        ignore BTree.insert(shards, Text.compare, shardID, newShardPrincipal);
                        shardCount += 1;
                        #ok(actor (Principal.toText(newShardPrincipal)) : SharedActivityShard.SharedActivityShard);
                    };
                    case (#err(e)) {
                        #err(e);
                    };
                };
            };
        };
    };

    private func getShardID(activityID : Text) : Text {
        let activityNum = Nat.fromText(activityID);
        switch (activityNum) {
            case (?num) {
                let shardIndex = num / ACTIVITIES_PER_SHARD;
                "shard-" # Nat.toText(shardIndex + 1);
            };
            case null { "shard-0" }; // Default to first shard if invalid activity ID
        };
    };

    public func createShard() : async Result.Result<Principal, Text> {
        if (Array.size(sharedActivityShardWasmModule) == 0) {
            return #err("Wasm module not set. Please update the Wasm module first.");
        };

        try {
            let cycles = 10_000_000_000_000;
            Cycles.add<system>(cycles);
            let newCanister = await ic.create_canister({ settings = null });
            let canisterPrincipal = newCanister.canister_id;

            let installResult = await ic.install_code({
                arg = [];
                wasm_module = sharedActivityShardWasmModule;
                mode = #install;
                canister_id = canisterPrincipal;
            });

            #ok(canisterPrincipal);

        } catch (e) {
            #err("Failed to create shard: " # Error.message(e));
        };
    };

    // public func getNextActivityID() : async Text {
    //     totalActivityCount += 1;
    //     Nat.toText(totalActivityCount);
    // };

    public func updateUserShardMap(userID : Text, activityID : Text) : async Result.Result<(), Text> {
        let shardID = getShardID(activityID);
        switch (BTree.get(userShardMap, Text.compare, userID)) {
            case (?shardIDs) {
                switch (Array.find<Text>(shardIDs, func(id) { id == shardID })) {
                    case (null) {
                        let updatedShardIDs = Array.append<Text>(shardIDs, [shardID]);
                        ignore BTree.insert(userShardMap, Text.compare, userID, updatedShardIDs);
                    };
                    case (_) {}; // Shard already exists, do nothing
                };
            };
            case null {
                ignore BTree.insert(userShardMap, Text.compare, userID, [shardID]);
            };
        };
        #ok(());
    };

    public func getUserShards(userID : Text) : async Result.Result<[SharedActivityShard.SharedActivityShard], Text> {
        switch (BTree.get(userShardMap, Text.compare, userID)) {
            case (?shardIDs) {
                let shardBuffer = Buffer.Buffer<SharedActivityShard.SharedActivityShard>(0);
                for (shardID in shardIDs.vals()) {
                    switch (BTree.get(shards, Text.compare, shardID)) {
                        case (?principal) {
                            shardBuffer.add(actor (Principal.toText(principal)) : SharedActivityShard.SharedActivityShard);
                        };
                        case null {
                            // Skip if shard not found
                        };
                    };
                };
                #ok(Buffer.toArray(shardBuffer));
            };
            case null {
                #err("No shards found for user ID: " # userID);
            };
        };
    };

    public func getNextActivityID(userID : Text) : async Result.Result<Text, Text> {
        totalActivityCount += 1;
        let activityID = Nat.toText(totalActivityCount);
        let updateResult = await updateUserShardMap(userID, activityID);
        switch (updateResult) {
            case (#ok(_)) {
                #ok(activityID);
            };
            case (#err(e)) {
                #err("Failed to update user shard map: " # e);
            };
        };
    };

    // Other necessary functions...
};
