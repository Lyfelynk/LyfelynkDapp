import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";

import Types "../Types";
import CanisterTypes "../Types/CanisterTypes";
import ManagerCanisterTypes "../Types/ManagerCanisterTypes";
import Hex "../utility/Hex";

actor class UserService() {
    type HealthIDUser = Types.HealthIDUser;

    let ShardManager = ManagerCanisterTypes.userShardManager;
    let identityManager = CanisterTypes.identityManager;
    let vetkd_system_api = CanisterTypes.vetkd_system_api;

    // Function to create a new user
    public shared ({ caller }) func createUser(userData : Types.HealthIDUserData) : async Result.Result<Text, Text> {
        let userIDResult = await ShardManager.generateUserID(); // Generate User ID via UserShardManager
        let uuidResult = await ShardManager.generateUUID(); // Generate UUID via UserShardManager

        switch (userIDResult, uuidResult) {
            case (#ok(userID), #ok(uuid)) {
                let tempID : HealthIDUser = {
                    // Temporary User ID Data Structure
                    IDNum = userID;
                    UUID = uuid;
                    MetaData = {
                        // User Metadata
                        DemographicInformation = userData.DemographicInformation;
                        BasicHealthParameters = userData.BasicHealthParameters;
                        BiometricData = userData.BiometricData;
                        FamilyInformation = userData.FamilyInformation;
                    };
                };
                let registerResult = await ShardManager.registerUser(caller, userID);
                switch (registerResult) {
                    case (#ok(())) {
                        let identityResult = await identityManager.registerIdentity(caller, userID, "User");
                        switch (identityResult) {
                            case (#ok(())) {
                                // Insert user data into the shard
                                let shardResult = await ShardManager.getShard(userID);
                                switch (shardResult) {
                                    case (#ok(shard)) {
                                        let insertResult = await shard.insertUser(userID, tempID);
                                        switch (insertResult) {
                                            case (#ok(())) {
                                                #ok(userID);
                                            };
                                            case (#err(e)) {
                                                #err("Failed to insert user data: " # e);
                                            };
                                        };
                                    };
                                    case (#err(e)) {
                                        #err("Failed to get shard: " # e);
                                    };
                                };
                            };
                            case (#err(e)) {
                                #err("Failed to register identity: " # e);
                            };
                        };
                    };
                    case (#err(e)) { #err("Failed to register user: " # e) };
                };
            };
            case (#err(e), _) { #err("Failed to generate user ID: " # e) };
            case (_, #err(e)) { #err("Failed to generate UUID: " # e) };
        };
    };

    // Function to read user data
    public shared ({ caller }) func readUser() : async Result.Result<HealthIDUser, Text> {
        let userIDResult = await ShardManager.getUserID(caller); // Get User ID via UserShardManager
        switch (userIDResult) {
            case (#ok(id)) {
                let shardResult = await ShardManager.getShard(id); // Get Shard via UserShardManager
                switch (shardResult) {
                    case (#ok(shard)) {
                        let userResult = await shard.getUser(id); // Get User via Shard
                        switch (userResult) {
                            case (#ok(user)) {
                                #ok(user); // Return User
                            };
                            case (#err(e)) {
                                #err("Failed to get user: " # e);
                            };
                        };
                    };
                    case (#err(e)) {
                        #err("Failed to get shard: " # e);
                    };
                };
            };
            case (#err(e)) {
                #err("You are not registered as a Health User: " # e);
            };
        };
    };

    // Function to update user data
    public shared ({ caller }) func updateUser(updateData : Types.HealthIDUserData) : async Result.Result<(), Text> {
        let userIDResult = await ShardManager.getUserID(caller);
        switch (userIDResult) {
            case (#ok(id)) {
                let shardResult = await ShardManager.getShard(id);
                switch (shardResult) {
                    case (#ok(shard)) {
                        let userResult = await shard.getUser(id);
                        switch (userResult) {
                            case (#ok(value)) {
                                let updatedID : HealthIDUser = {
                                    IDNum = value.IDNum;
                                    UUID = value.UUID;
                                    MetaData = {
                                        DemographicInformation = updateData.DemographicInformation;
                                        BasicHealthParameters = updateData.BasicHealthParameters;
                                        BiometricData = updateData.BiometricData;
                                        FamilyInformation = updateData.FamilyInformation;
                                    };
                                };

                                ignore await shard.updateUser(id, updatedID);
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
            case (#err(_)) {
                #err("You're not registered as a Health User");
            };
        };
    };

    // Function to delete a user
    public shared ({ caller }) func deleteUser() : async Result.Result<Text, Text> {
        let userIDResult = await ShardManager.getUserID(caller);
        switch (userIDResult) {
            case (#ok(id)) {
                let shardResult = await ShardManager.getShard(id);
                switch (shardResult) {
                    case (#ok(shard)) {
                        let deleteResult = await shard.deleteUser(id);
                        switch (deleteResult) {
                            case (#ok(_)) {
                                let removeIdentityResult = await identityManager.removeIdentity(id);
                                switch (removeIdentityResult) {
                                    case (#ok(())) {
                                        let removeUserResult = await ShardManager.removeUser(caller);
                                        switch (removeUserResult) {
                                            case (#ok(())) {
                                                #ok("User deleted successfully");
                                            };
                                            case (#err(e)) {
                                                #err(e);
                                            };
                                        };
                                    };
                                    case (#err(e)) {
                                        #err(e);
                                    };
                                };
                            };
                            case (#err(e)) {
                                #err(e);
                            };
                        };
                    };
                    case (#err(e)) {
                        #err(e);
                    };
                };
            };
            case (#err(_)) {
                #err("You're not registered as a Health User");
            };
        };
    };

    // Function to get the caller's principal ID
    public shared query ({ caller }) func whoami() : async Text {
        Principal.toText(caller);
    };

    // Function to check if the caller is registered
    public shared ({ caller }) func isRegistered() : async Result.Result<Text, Text> {
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous persons can't register, please login with wallet or internet identity");
        };

        let userIDResult = await ShardManager.getUserID(caller);
        switch (userIDResult) {
            case (#ok(_)) {
                #ok("User");
            };
            case (#err(_)) {
                #err("Not Registered");
            };
        };
    };

    // Function to get the user ID of the caller
    public shared ({ caller }) func getID() : async Result.Result<Text, Text> {
        await ShardManager.getUserID(caller);
    };

    public func getUserIDPrincipal(userID : Text) : async Result.Result<Principal, Text> {

        let result = await ShardManager.getPrincipalByUserID(userID);
        switch (result) {
            case (#ok(principal)) {
                #ok(principal);
            };
            case (#err(err)) {
                #err((err));
            };
        };

    };

    // Function to get the total number of users
    public func getNumberOfUsers() : async Nat {
        await ShardManager.getTotalUserCount();
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

    public shared ({ caller }) func encrypted_symmetric_key_for_user(encryption_public_key : Blob) : async Result.Result<Text, Text> {
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

    //VetKey Section

};
