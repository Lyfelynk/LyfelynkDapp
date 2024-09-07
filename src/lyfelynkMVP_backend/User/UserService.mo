import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";

import IdentityManager "../IdentityManager/IdentityManager";
import Types "../Types";
import Hex "../utility/Hex";
import UserShardManager "UserShardManager";
actor class UserService() {
    type HealthIDUser = Types.HealthIDUser;
    type UserShardManager = UserShardManager.UserShardManager;

    private var adminPrincipal = ""; //Admin Principal
    private var isAdminRegistered = false; //Admin Registration Status
    let ShardManager : UserShardManager = actor ("aovwi-4maaa-aaaaa-qaagq-cai"); // User Shard Manager Canister ID
    let identityManager : IdentityManager.IdentityManager = actor ("by6od-j4aaa-aaaaa-qaadq-cai"); // Replace with actual IdentityManager canister ID
    let vetkd_system_api : Types.VETKD_SYSTEM_API = actor ("c2lt4-zmaaa-aaaaa-qaaiq-cai");

    // Function to create a new user
    public shared ({ caller }) func createUser(demoInfo : Blob, basicHealthPara : Blob, bioMData : ?Blob, familyData : ?Blob) : async Result.Result<Text, Text> {
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
                        DemographicInformation = demoInfo;
                        BasicHealthParameters = basicHealthPara;
                        BiometricData = bioMData;
                        FamilyInformation = familyData;
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
    public shared ({ caller }) func updateUser(demoInfo : Blob, basicHealthPara : Blob, bioMData : ?Blob, familyData : ?Blob) : async Result.Result<(), Text> {
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
                                        DemographicInformation = demoInfo;
                                        BasicHealthParameters = basicHealthPara;
                                        BiometricData = bioMData;
                                        FamilyInformation = familyData;
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

    public shared ({ caller }) func updateUserShardWasmModule(wasmModule : [Nat8]) : async Result.Result<(), Text> {

        // if (isAdmin(caller)) {
        // Call the updateWasmModule function of the UserShardManager
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
            case (#err(message)) {
                #err((message));
            };
        };

    };

    // Function to get the total number of users
    public func getNumberOfUsers() : async Nat {
        await ShardManager.getTotalUserCount();
    };

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

    //VetKey

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

};
