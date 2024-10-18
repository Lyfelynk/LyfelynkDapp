import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import BTree "mo:stableheapbtreemap/BTree";

import Types "../Types";
import CanisterIDs "../Types/CanisterIDs";

actor class UserShard() {
    // BTree to store user data
    private var userMap : BTree.BTree<Text, Types.HealthIDUser> = BTree.init<Text, Types.HealthIDUser>(null);
    // private var adminPrincipal = Types.admin;

    private var permittedPrincipal : [Principal] = [Principal.fromText(CanisterIDs.userShardManagerCanisterID), Principal.fromText(CanisterIDs.userServiceCanisterID)];

    // Function to insert a user
    public shared ({ caller }) func insertUser(userID : Text, user : Types.HealthIDUser) : async Result.Result<(), Text> {
        if (not isPermitted(caller)) {
            return #err("You are not permitted");
        };
        if (BTree.has(userMap, Text.compare, userID)) {
            return #err("User with ID " # userID # " already exists");
        } else {
            let insertResult = BTree.insert(userMap, Text.compare, userID, user);
            switch (insertResult) {
                case null {
                    if (BTree.has(userMap, Text.compare, userID)) {
                        return #ok(());
                    } else {
                        return #err("Failed to insert user with user ID " # userID);
                    };
                };
                case (?_) {
                    return #err("Unexpected result: User already existed");
                };
            };
        };
    };

    // Function to get a user by ID
    public shared ({ caller }) func getUser(userID : Text) : async Result.Result<Types.HealthIDUser, Text> {
        if (not isPermitted(caller)) {
            return #err("You are not permitted");
        };
        switch (BTree.get(userMap, Text.compare, userID)) {
            case (?value) { return #ok(value) };
            case null { return #err("User not found") };
        };
    };

    // Function to update a user
    public shared ({ caller }) func updateUser(userID : Text, user : Types.HealthIDUser) : async Result.Result<(), Text> {
        if (not isPermitted(caller)) {
            return #err("You are not permitted");
        };
        switch (BTree.get(userMap, Text.compare, userID)) {
            case (?_) {
                switch (BTree.insert(userMap, Text.compare, userID, user)) {
                    case (?_) { return #ok(()) };
                    case null { return #err("Failed to update user") };
                };
            };
            case null {
                return #err("User not found");
            };
        };
    };

    // Function to delete a user
    public shared ({ caller }) func deleteUser(userID : Text) : async Result.Result<(), Text> {
        if (not isPermitted(caller)) {
            return #err("You are not permitted");
        };
        switch (BTree.delete(userMap, Text.compare, userID)) {
            case (?_) { return #ok(()) };
            case null { return #err("User not found") };
        };
    };

    // Function to get the total number of users
    public query func getUserCount() : async Nat {
        BTree.size(userMap);
    };

    // Function to get all user IDs
    public query func getAllUserIDs() : async [Text] {
        Array.map(BTree.toArray(userMap), func((id, _) : (Text, Types.HealthIDUser)) : Text { id });
    };

    private func isPermitted(principal : Principal) : Bool {
        for (permittedPrincipal in permittedPrincipal.vals()) {
            if (principal == permittedPrincipal) {
                return true;
            };
        };
        return false;
    };

    // private func isAdmin(caller : Principal) : Bool {
    //     if (Principal.fromText(adminPrincipal) == caller) {
    //         true;
    //     } else {
    //         false;
    //     };
    // };

    public shared ({ caller }) func addPermittedPrincipal(principalToAdd : Text) : async Result.Result<Text, Text> {

        if (not isPermitted(caller)) {
            return #err("You are not Admin, only admin can perform this action");
        };

        let permittedPrincipalBuffer = Buffer.fromArray<Principal>(permittedPrincipal);
        permittedPrincipalBuffer.add(Principal.fromText(principalToAdd));
        permittedPrincipal := Buffer.toArray(permittedPrincipalBuffer);
        return #ok("Added Principal as Permitted Permitted Principal Successfully");
    };

    public shared ({ caller }) func removePermittedPrincipal(principalToRemove : Text) : async Result.Result<Text, Text> {
        if (not isPermitted(caller)) {
            return #err("You are not Admin, only admin can perform this action");
        };

        let permittedPrincipalBuffer = Buffer.fromArray<Principal>(permittedPrincipal);
        let indexToRemove = Buffer.indexOf<Principal>(Principal.fromText(principalToRemove), permittedPrincipalBuffer, Principal.equal);
        switch (indexToRemove) {
            case (?value) {
                ignore permittedPrincipalBuffer.remove(value);
                permittedPrincipal := Buffer.toArray(permittedPrincipalBuffer);
                return #ok("Removed Principal from Permitted Principal Successfully");
            };
            case (null) {
                return #err("Princial ID is not present to remove");
            };
        };

    };

};
