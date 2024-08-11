import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";

import Types "../Types";
import Hex "../utility/Hex";
import UserShardManager "UserShardManager";

actor UserService {
    type HealthIDUser = Types.HealthIDUser;
    type UserShardManager = UserShardManager.UserShardManager;

    let ShardManager : UserShardManager = actor ("bw4dl-smaaa-aaaaa-qaacq-cai"); // Replace with actual canister ID

    // Function to create a new user
    public shared ({ caller }) func createUser(demoInfo : Blob, basicHealthPara : Blob, bioMData : ?Blob, familyData : ?Blob) : async Result.Result<Text, Text> {
        let userIDResult = await ShardManager.generateUserID();
        let uuidResult = await ShardManager.generateUUID();

        switch (userIDResult, uuidResult) {
            case (#ok(userID), #ok(uuid)) {
                let tempID : HealthIDUser = {
                    IDNum = userID;
                    UUID = uuid;
                    MetaData = {
                        DemographicInformation = demoInfo;
                        BasicHealthParameters = basicHealthPara;
                        BiometricData = bioMData;
                        FamilyInformation = familyData;
                    };
                };

                let shardResult = await ShardManager.getShard(userID);
                switch (shardResult) {
                    case (#ok(shard)) {
                        let result = await shard.insertUser(userID, tempID);
                        switch (result) {
                            case (#ok(_)) {
                                ignore await ShardManager.registerUser(caller, userID);
                                #ok(userID);
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
            case (#err(err), _) {
                #err("Failed to generate user ID: " # err);
            };
            case (_, #err(err)) {
                #err("Failed to generate UUID: " # err);
            };
        };
    };

    // Function to read user data
    public shared ({ caller }) func readUser() : async Result.Result<HealthIDUser, Text> {
        let userIDResult = await ShardManager.getUserID(caller);
        switch (userIDResult) {
            case (#ok(id)) {
                let shardResult = await ShardManager.getShard(id);
                switch (shardResult) {
                    case (#ok(shard)) {
                        let userResult = await shard.getUser(id);
                        switch (userResult) {
                            case (#ok(user)) {
                                #ok(user);
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
    public shared ({ caller }) func deleteUser() : async Result.Result<(), Text> {
        let userIDResult = await ShardManager.getUserID(caller);
        switch (userIDResult) {
            case (#ok(id)) {
                let shardResult = await ShardManager.getShard(id);
                switch (shardResult) {
                    case (#ok(shard)) {
                        let deleteResult = await shard.deleteUser(id);
                        switch (deleteResult) {
                            case (#ok(_)) {
                                ignore await ShardManager.removeUser(caller);
                                #ok(());
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

    // Helper function to check if a principal is an admin
    private func isAdmin(principal : Principal) : Bool {

        // For example, you could have a list of admin principals:
        let adminPrincipals : [Principal] = [
            // Add your admin principals here
        ];

        for (adminPrincipal in adminPrincipals.vals()) {
            if (principal == adminPrincipal) {
                return true;
            };
        };

        false;
    };
    // Function to get the user ID of the caller
    public shared ({ caller }) func getID() : async Result.Result<Text, Text> {
        await ShardManager.getUserID(caller);
    };

    // Function to get the total number of users
    public func getNumberOfUsers() : async Nat {
        await ShardManager.getTotalUserCount();
    };

    //VetKey

    //VetKey Section

    type VETKD_SYSTEM_API = actor {
        vetkd_public_key : ({
            canister_id : ?Principal;
            derivation_path : [Blob];
            key_id : { curve : { #bls12_381 }; name : Text };
        }) -> async ({ public_key : Blob });
        vetkd_encrypted_key : ({
            public_key_derivation_path : [Blob];
            derivation_id : Blob;
            key_id : { curve : { #bls12_381 }; name : Text };
            encryption_public_key : Blob;
        }) -> async ({ encrypted_key : Blob });
    };

    let vetkd_system_api : VETKD_SYSTEM_API = actor ("asrmz-lmaaa-aaaaa-qaaeq-cai");

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
