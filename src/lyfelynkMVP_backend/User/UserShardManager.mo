import Array "mo:base/Array";
import Debug "mo:base/Debug";
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
import UserShard "UserShard";

actor class UserShardManager() {
    private stable var totalUserCount : Nat = 0;
    private stable var shardCount : Nat = 0;
    private let USERS_PER_SHARD : Nat = 21_000;
    private let STARTING_USER_ID : Nat = 10_000_000_000_000; // Starting User ID
    private stable let shards : BTree.BTree<Text, Principal> = BTree.init<Text, Principal>(null); //Shard Number to Shard Canister ID
    private stable var userShardMap : BTree.BTree<Principal, Text> = BTree.init<Principal, Text>(null); // Principal to User ID
    private stable var reverseUserShardMap : BTree.BTree<Text, Principal> = BTree.init<Text, Principal>(null); // User ID to Principal

    private stable var userShardWasmModule : [Nat8] = []; // Wasm Module for Shard Canister

    private let IC = "aaaaa-aa";
    private let ic : Interface.Self = actor (IC);

    // Function to generate a new user ID
    public func generateUserID() : async Result.Result<Text, Text> {

        #ok(Nat.toText(STARTING_USER_ID + totalUserCount));
    };

    // Function to generate a UUID
    public func generateUUID() : async Result.Result<Text, Text> {
        let g = Source.Source();
        #ok(UUID.toText(await g.new()));
    };

    // Function to get the shard ID for a user
    private func getShardID(userID : Text) : Text {
        switch (Nat.fromText(userID)) {
            case (?value) {
                if (value >= STARTING_USER_ID) {

                    let shardIndex = (value - STARTING_USER_ID) / USERS_PER_SHARD;
                    return Nat.toText(shardIndex);
                };
                return ("not a valid User ID");
            };
            case (null) { return ("not a valid User ID") };
        };

    };

    // Function to get the shard for a user
    public func getShard(userID : Text) : async Result.Result<UserShard.UserShard, Text> {
        if (shardCount == 0 or totalUserCount >= shardCount * USERS_PER_SHARD) {
            // Create a new shard
            let newShardResult = await createShard();
            switch (newShardResult) {
                case (#ok(newShardPrincipal)) {
                    let newShardID = "shard-" # Nat.toText(shardCount);
                    ignore BTree.insert(shards, Text.compare, newShardID, newShardPrincipal);
                    shardCount += 1;
                    return #ok(actor (Principal.toText(newShardPrincipal)) : UserShard.UserShard);
                };
                case (#err(e)) {
                    return #err(e);
                };
            };
        };

        let shardID = getShardID(userID);
        switch (BTree.get(shards, Text.compare, "shard-" #shardID)) {
            case (?principal) {
                #ok(actor (Principal.toText(principal)) : UserShard.UserShard);
            };
            case null {
                #err("Shard not found for user ID: " # userID);
            };
        };
    };

    // Function to register a user
    public func registerUser(caller : Principal, userID : Text) : async Result.Result<(), Text> {
        switch (BTree.get(userShardMap, Principal.compare, caller)) {
            case (?_) {
                #err("User already registered");
            };
            case null {
                ignore BTree.insert(userShardMap, Principal.compare, caller, userID); // Insert Principal to UserID Key Value Pair
                ignore BTree.insert(reverseUserShardMap, Text.compare, userID, caller); // Insert UserID to Principal Key Value Pair
                totalUserCount += 1;
                #ok(());
            };
        };
    };

    // Function to get the user ID for a given principal
    public func getUserID(caller : Principal) : async Result.Result<Text, Text> {
        switch (BTree.get(userShardMap, Principal.compare, caller)) {
            // Get UserID from Principal
            case (?userID) {
                #ok(userID);
            };
            case null {
                #err("User ID not found for the given principal");
            };
        };
    };
    // New function to get Principal by user ID
    public func getPrincipalByUserID(userID : Text) : async Result.Result<Principal, Text> {
        switch (BTree.get(reverseUserShardMap, Text.compare, userID)) {
            // Get Principal from UserID
            case (?principal) {
                #ok(principal);
            };
            case null {
                #err("No principal found for user ID: " # userID);
            };
        };
    };
    // Function to remove a user
    public shared ({ caller }) func removeUser(userToRemove : Principal) : async Result.Result<(), Text> {
        if (not isPermitted(caller)) {
            return #err("You are not permitted to remove users");
        };
        switch (BTree.get(userShardMap, Principal.compare, userToRemove)) {
            case (?userID) {
                ignore BTree.delete(userShardMap, Principal.compare, userToRemove); //Remove Principal to UserID
                ignore BTree.delete(reverseUserShardMap, Text.compare, userID); //Remove UserID to Principal
                totalUserCount -= 1;
                #ok(());
            };
            case null {
                #err("User not found");
            };
        };
    };

    // Function to get the users in a specific shard
    public shared ({ caller }) func getUsersInShard(shardID : Text) : async [Text] {
        if (isPermitted(caller)) {

        } else {
            Debug.trap("You are not permitted");
        };
        switch (BTree.get(shards, Text.compare, shardID)) {
            case (?principal) {
                // Assuming each shard has a method to get all user principals
                let shard = actor (Principal.toText(principal)) : UserShard.UserShard;
                await shard.getAllUserIDs();
            };
            case null {
                [];
            };
        };
    };

    // Private function to create a new shard
    private func createShard() : async Result.Result<Principal, Text> {

        if (Array.size(userShardWasmModule) == 0) {
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

    // Private function to install code on a shard
    private func installCodeOnShard(canisterPrincipal : Principal) : async Result.Result<(), Text> {
        let arg = [];

        try {
            await ic.install_code({
                arg = arg;
                wasm_module = userShardWasmModule; // Use the UserShard module directly
                mode = #install;
                canister_id = canisterPrincipal;
            });

            await ic.start_canister({ canister_id = canisterPrincipal });
            #ok(());
        } catch (e) {
            #err("Failed to install or start code on shard: " # Error.message(e));
        };
    };

    // Function to update the WASM module
    public shared ({ caller }) func updateWasmModule(wasmModule : [Nat8]) : async Result.Result<(), Text> {
        if (isPermitted(caller)) {
            return #err("You are not permitted to update shard");
        };
        if (Array.size(wasmModule) < 8) {
            return #err("Invalid WASM module: too small");
        };

        userShardWasmModule := wasmModule;
        #ok(());
    };

    public shared ({ caller }) func updateExistingShards() : async Result.Result<(), Text> {

        if (isPermitted(caller)) {
            return #err("You are not permitted to update shard");
        };
        if (Array.size(userShardWasmModule) == 0) {
            return #err("Wasm module not set. Please update the Wasm module first.");
        };

        var updatedCount = 0;
        var errorCount = 0;

        for ((shardID, principal) in BTree.entries(shards)) {
            let installResult = await installCodeOnShard(principal);
            switch (installResult) {
                case (#ok(())) {
                    updatedCount += 1;
                };
                case (#err(_)) {
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

    private func isPermitted(principal : Principal) : Bool {
        // For example, you could have a list of admin principals:
        let permittedPrincipals : [Principal] = [
            // Add your admin principals here
        ];

        for (permittedPrincipal in permittedPrincipals.vals()) {
            if (principal == permittedPrincipal) {
                return true;
            };
        };
        return false;
    };

    // Query function to get the total user count
    public query func getTotalUserCount() : async Nat {
        totalUserCount;
    };

    // Query function to get the shard count
    public query func getShardCount() : async Nat {
        shardCount;
    };

    // Query function to get the number of users per shard
    public query func getUsersPerShard() : async Nat {
        USERS_PER_SHARD;
    };

};
