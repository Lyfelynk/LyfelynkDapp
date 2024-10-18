import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Error "mo:base/Error";
import Cycles "mo:base/ExperimentalCycles";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import BTree "mo:stableheapbtreemap/BTree";

import IdentityManager "../IdentityManager/IdentityManager";
import Types "../Types";
import Interface "../utility/ic-management-interface";
import MarketplaceShard "MarketplaceShard";

actor class MarketplaceShardManager() {
    private stable var totalListingCount : Nat = 0;
    private stable var shardCount : Nat = 0;
    private let LISTINGS_PER_SHARD : Nat = 1000;
    private stable let shards : BTree.BTree<Text, Principal> = BTree.init<Text, Principal>(null);
    private let identityManager : IdentityManager.IdentityManager = actor (Types.identityManagerCanisterID);
    private stable var userShardMap : BTree.BTree<Text, [Text]> = BTree.init<Text, [Text]>(null);
    private stable var marketplaceShardWasmModule : [Nat8] = [];

    private let IC = "aaaaa-aa";
    private let ic : Interface.Self = actor (IC);

    private stable var permittedPrincipals : [Principal] = [];

    public func getShard(listingID : Text) : async Result.Result<MarketplaceShard.MarketplaceShard, Text> {
        let shardID = getShardID(listingID);
        switch (BTree.get(shards, Text.compare, shardID)) {
            case (?principal) {
                #ok(actor (Principal.toText(principal)) : MarketplaceShard.MarketplaceShard);
            };
            case null {
                let newShardResult = await createShard();
                switch (newShardResult) {
                    case (#ok(newShardPrincipal)) {
                        ignore BTree.insert(shards, Text.compare, shardID, newShardPrincipal);
                        shardCount += 1;
                        #ok(actor (Principal.toText(newShardPrincipal)) : MarketplaceShard.MarketplaceShard);
                    };
                    case (#err(e)) {
                        #err(e);
                    };
                };
            };
        };
    };

    private func getShardID(listingID : Text) : Text {
        switch (Nat.fromText(listingID)) {
            case (?num) {
                let shardIndex = num / LISTINGS_PER_SHARD;
                "shard-" # Nat.toText(shardIndex + 1);
            };
            case null { "shard-1" }; // Default to first shard if invalid ID
        };
    };

    private func createShard() : async Result.Result<Principal, Text> {
        if (Array.size(marketplaceShardWasmModule) == 0) {
            return #err("Wasm module not set. Please update the Wasm module first.");
        };

        try {
            let cycles = 10_000_000_000_000;
            Cycles.add(cycles);
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
                wasm_module = marketplaceShardWasmModule;
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
        if (not isAdmin(caller)) {
            return #err("You are not permitted to update the WASM module");
        };
        if (Array.size(wasmModule) < 8) {
            return #err("Invalid WASM module: too small");
        };

        marketplaceShardWasmModule := wasmModule;
        #ok(());
    };

    public shared ({ caller }) func updateExistingShards() : async Result.Result<(), Text> {
        if (not isAdmin(caller)) {
            return #err("You are not permitted to update shards");
        };
        if (Array.size(marketplaceShardWasmModule) == 0) {
            return #err("Wasm module not set. Please update the Wasm module first.");
        };

        var updatedCount = 0;
        var errorCount = 0;

        for ((shardID, principal) in BTree.entries(shards)) {
            let installResult = await reinstallCodeOnShard(principal);
            switch (installResult) {
                case (#ok(())) {
                    updatedCount += 1;
                };
                case (#err(_err)) {
                    errorCount += 1;
                };
            };
        };

        if (errorCount > 0) {
            #err("Updated " # Nat.toText(updatedCount) # " shards, but encountered errors in " # Nat.toText(errorCount) # " shards");
        } else {
            #ok(());
        };
    };

    public func updateUserShardMap(userID : Text, shardID : Text) : async Result.Result<(), Text> {
        switch (BTree.get(userShardMap, Text.compare, userID)) {
            case null {
                let newBuffer = Buffer.Buffer<Text>(1);
                newBuffer.add(shardID);
                ignore BTree.insert(userShardMap, Text.compare, userID, Buffer.toArray(newBuffer));
            };
            case (?existingArray) {
                let buffer = Buffer.fromArray<Text>(existingArray);
                if (not Buffer.contains<Text>(buffer, shardID, Text.equal)) {
                    buffer.add(shardID);
                    ignore BTree.insert(userShardMap, Text.compare, userID, Buffer.toArray(buffer));
                };
            };
        };
        #ok(());
    };

    public func getUserShards(userID : Text) : async Result.Result<[MarketplaceShard.MarketplaceShard], Text> {
        switch (BTree.get(userShardMap, Text.compare, userID)) {
            case null { #err("No shards found for user") };
            case (?shardIDs) {
                let shardActors = Buffer.Buffer<MarketplaceShard.MarketplaceShard>(shardIDs.size());
                for (shardID in shardIDs.vals()) {
                    switch (BTree.get(shards, Text.compare, shardID)) {
                        case (?principal) {
                            shardActors.add(actor (Principal.toText(principal)) : MarketplaceShard.MarketplaceShard);
                        };
                        case null { /* Skip if shard not found */ };
                    };
                };
                #ok(Buffer.toArray(shardActors));
            };
        };
    };

    private func isAdmin(principal : Principal) : Bool {
        Array.find<Principal>(permittedPrincipals, func(p) { p == principal }) != null;
    };

    public query func getTotalListingCount() : async Nat {
        totalListingCount;
    };

    public query func getShardCount() : async Result.Result<Nat, Text> {
        #ok(shardCount);
    };

    public query func getListingsPerShard() : async Nat {
        LISTINGS_PER_SHARD;
    };

    public func getUserID(principal : Principal) : async Result.Result<Text, Text> {
        let identityResult = await identityManager.getIdentity(principal);
        switch (identityResult) {
            case (#ok((id, _))) { #ok(id) };
            case (#err(e)) { #err(e) };
        };
    };

    public func getPrincipal(userID : Text) : async Result.Result<Principal, Text> {
        let principalResult = await identityManager.getPrincipalByID(userID);
        switch (principalResult) {
            case (#ok(principal)) { #ok(principal) };
            case (#err(e)) { #err(e) };
        };
    };

    private func incrementTotalListingCount() : () {
        totalListingCount += 1;
    };

    public func getNextListingID() : async Result.Result<Text, Text> {
        incrementTotalListingCount();
        #ok(Nat.toText(totalListingCount - 1));
    };

    public shared ({ caller }) func addPermittedPrincipal(principal : Principal) : async Result.Result<(), Text> {
        if (not isAdmin(caller)) {
            return #err("You are not permitted to add permitted principals");
        };
        permittedPrincipals := Array.append(permittedPrincipals, [principal]);
        #ok(());
    };

    public shared ({ caller }) func removePermittedPrincipal(principal : Principal) : async Result.Result<(), Text> {
        if (not isAdmin(caller)) {
            return #err("You are not permitted to remove permitted principals");
        };
        permittedPrincipals := Array.filter(permittedPrincipals, func(p : Principal) : Bool { p != principal });
        #ok(());
    };

    public query func getShardPrincipal(shardID : Text) : async Result.Result<Principal, Text> {
        switch (BTree.get(shards, Text.compare, shardID)) {
            case (?principal) { #ok(principal) };
            case null { #err("Shard ID not found") };
        };
    };

    public query func getShardIDFromListingID(listingID : Text) : async Result.Result<Text, Text> {
        let shardID = getShardID(listingID);
        switch (BTree.get(shards, Text.compare, shardID)) {
            case (?principal) { #ok(shardID) };
            case null { #err("Shard ID not found") };
        };
    };

    private func reinstallCodeOnShard(canisterPrincipal : Principal) : async Result.Result<(), Text> {
        let arg = [];

        try {
            await ic.install_code({
                arg = arg;
                wasm_module = marketplaceShardWasmModule;
                mode = #reinstall;
                canister_id = canisterPrincipal;
            });

            await ic.start_canister({ canister_id = canisterPrincipal });
            #ok(());
        } catch (e) {
            #err("Failed to reinstall or start code on shard: " # Error.message(e));
        };
    };
};
