import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Text "mo:base/Text";
import BTree "mo:stableheapbtreemap/BTree";

import Types "../Types";

actor class UserShard() {
    // BTree to store user data
    private var userMap : BTree.BTree<Text, Types.HealthIDUser> = BTree.init<Text, Types.HealthIDUser>(null);

    // Function to insert a user
    public shared ({ caller }) func insertUser(userID : Text, user : Types.HealthIDUser) : async Result.Result<(), Text> {
        if (isPermitted(caller)) {

        } else {
            return #err("You are not permitted");
        };
        if (BTree.has(userMap, Text.compare, userID)) {
            #err("User with ID " # userID # " already exists");
        } else {
            let insertResult = BTree.insert(userMap, Text.compare, userID, user);
            switch (insertResult) {
                case null {
                    if (BTree.has(userMap, Text.compare, userID)) {
                        #ok(());
                    } else {
                        #err("Failed to insert user with user ID " # userID);
                    };
                };
                case (?_) {
                    #err("Unexpected result: User already existed");
                };
            };
        };
    };

    // Function to get a user by ID
    public shared ({ caller }) func getUser(userID : Text) : async Result.Result<Types.HealthIDUser, Text> {
        if (isPermitted(caller)) {

        } else {
            return #err("You are not permitted");
        };
        switch (BTree.get(userMap, Text.compare, userID)) {
            case (?value) { #ok(value) };
            case null { #err("User not found") };
        };
    };

    // Function to update a user
    public shared ({ caller }) func updateUser(userID : Text, user : Types.HealthIDUser) : async Result.Result<(), Text> {
        if (isPermitted(caller)) {

        } else {
            return #err("You are not permitted");
        };
        switch (BTree.get(userMap, Text.compare, userID)) {
            case (?_) {
                switch (BTree.insert(userMap, Text.compare, userID, user)) {
                    case (?_) { #ok(()) };
                    case null { #err("Failed to update user") };
                };
            };
            case null {
                #err("User not found");
            };
        };
    };

    // Function to delete a user
    public shared ({ caller }) func deleteUser(userID : Text) : async Result.Result<(), Text> {
        if (isPermitted(caller)) {

        } else {
            return #err("You are not permitted");
        };
        switch (BTree.delete(userMap, Text.compare, userID)) {
            case (?_) { #ok(()) };
            case null { #err("User not found") };
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
        false;
    };

    // Function to get the total number of users
    public query func getUserCount() : async Nat {
        BTree.size(userMap);
    };

    // Function to get all user IDs
    public query func getAllUserIDs() : async [Text] {
        Array.map(BTree.toArray(userMap), func((id, _) : (Text, Types.HealthIDUser)) : Text { id });
    };

};
