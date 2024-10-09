import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import List "mo:base/List";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import BTree "mo:stableheapbtreemap/BTree";

import Types "../Types";
import Hex "../utility/Hex";

actor class DataAssetShard() {
    private stable var dataAssetStorage = BTree.init<Text, BTree.BTree<Text, Types.DataAsset>>(null);
    private stable var dataAccessTP = BTree.init<Text, [Principal]>(null);
    private stable var dataAccessPT = BTree.init<Principal, [Text]>(null);

    let vetkd_system_api : Types.VETKD_SYSTEM_API = actor (Types.vetkdSystemCanisterID);

    // List of permitted principals (e.g., DataAssetShardManager)
    private stable var permittedPrincipals : [Principal] = []; // Add permitted principals here

    private func isPermitted(caller : Principal) : Bool {
        Array.find<Principal>(permittedPrincipals, func(p) { p == caller }) != null;
    };

    public shared ({ caller }) func addPermittedPrincipal(principal : Principal) : async Result.Result<(), Text> {
        // if (not isPermitted(caller)) {
        //     return #err("You are not permitted to perform this operation");
        // };
        permittedPrincipals := Array.append(permittedPrincipals, [principal]);
        #ok(());
    };

    public shared ({ caller }) func removePermittedPrincipal(principal : Principal) : async Result.Result<(), Text> {
        if (not isPermitted(caller)) {
            return #err("You are not permitted to perform this operation");
        };
        permittedPrincipals := Array.filter(permittedPrincipals, func(p : Principal) : Bool { p != principal });
        #ok(());
    };

    public shared ({ caller }) func insertDataAsset(userID : Text, timestamp : Text, asset : Types.DataAsset, userPrincipal : Principal) : async Result.Result<Text, Text> {
        // if (not isPermitted(caller)) {
        //     return #err("You are not permitted to perform this operation");
        // };

        switch (BTree.get(dataAssetStorage, Text.compare, userID)) {
            case null {
                let newTree = BTree.init<Text, Types.DataAsset>(null);
                ignore BTree.insert(newTree, Text.compare, timestamp, asset);
                ignore BTree.insert(dataAssetStorage, Text.compare, userID, newTree);
            };
            case (?existingTree) {
                ignore BTree.insert(existingTree, Text.compare, timestamp, asset);
                ignore BTree.insert(dataAssetStorage, Text.compare, userID, existingTree);
            };
        };
        switch (await grantAccess(asset.assetID, userPrincipal)) {
            case (#ok(value)) {
                #ok(asset.assetID);
            };
            case (#err(error)) {
                #err("Unable to grant access to the party");
            };
        };

    };

    public shared query ({ caller }) func getDataAsset(userID : Text, timestamp : Text) : async Result.Result<Types.DataAsset, Text> {
        // if (not isPermitted(caller)) {
        //     return #err("You are not permitted to perform this operation");
        // };

        switch (BTree.get(dataAssetStorage, Text.compare, userID)) {
            case null { #err("User not found") };
            case (?userAssets) {
                switch (BTree.get(userAssets, Text.compare, timestamp)) {
                    case null { #err("Data asset not found") };
                    case (?asset) { #ok(asset) };
                };
            };
        };
    };

    public shared query ({ caller }) func getUserDataAssets(userID : Text) : async Result.Result<[(Text, Types.DataAsset)], Text> {
        // if (not isPermitted(caller)) {
        //     return #err("You are not permitted to perform this operation");
        // };

        switch (BTree.get(dataAssetStorage, Text.compare, userID)) {
            case null { #err("User not found") };
            case (?userAssets) {
                let assets = Buffer.Buffer<(Text, Types.DataAsset)>(0);
                for ((timestamp, asset) in BTree.entries(userAssets)) {
                    assets.add((timestamp, asset));
                };
                #ok(Buffer.toArray(assets));
            };
        };
    };

    public shared ({ caller }) func updateDataAsset(userID : Text, timestamp : Text, updatedAsset : Types.DataAsset) : async Result.Result<(), Text> {
        // if (not isPermitted(caller)) {
        //     return #err("You are not permitted to perform this operation");
        // };

        switch (BTree.get(dataAssetStorage, Text.compare, userID)) {
            case null { #err("User not found") };
            case (?userAssets) {
                switch (BTree.get(userAssets, Text.compare, timestamp)) {
                    case null { #err("Data asset not found") };
                    case (?asset) {
                        let newupdatedAsset = {
                            updatedAsset with
                            assetID = asset.assetID;
                        };
                        ignore BTree.insert(userAssets, Text.compare, timestamp, newupdatedAsset);
                        ignore BTree.insert(dataAssetStorage, Text.compare, userID, userAssets);
                        #ok(());
                    };
                };

            };
        };
    };

    public shared ({ caller }) func deleteDataAsset(userID : Text, timestamp : Text) : async Result.Result<(), Text> {
        // if (not isPermitted(caller)) {
        //     return #err("You are not permitted to perform this operation");
        // };

        switch (BTree.get(dataAssetStorage, Text.compare, userID)) {
            case null { #err("User not found") };
            case (?userAssets) {
                ignore BTree.delete(userAssets, Text.compare, timestamp);

                #ok(());
            };
        };
    };

    public shared ({ caller }) func grantAccess(assetID : Text, userID : Principal) : async Result.Result<(), Text> {
        // if (not isPermitted(caller)) {
        //     return #err("You are not permitted to perform this operation");
        // };

        // Update dataAccessTP
        switch (BTree.get(dataAccessTP, Text.compare, assetID)) {
            case null {
                ignore BTree.insert(dataAccessTP, Text.compare, assetID, [userID]);
            };
            case (?principals) {
                let updatedPrincipals = Array.append(principals, [userID]);
                ignore BTree.insert(dataAccessTP, Text.compare, assetID, updatedPrincipals);
            };
        };

        // Update dataAccessPT
        switch (BTree.get(dataAccessPT, Principal.compare, userID)) {
            case null {
                ignore BTree.insert(dataAccessPT, Principal.compare, userID, [assetID]);
            };
            case (?assets) {
                let updatedAssets = Array.append(assets, [assetID]);
                ignore BTree.insert(dataAccessPT, Principal.compare, userID, updatedAssets);
            };
        };

        #ok(());
    };

    public shared ({ caller }) func revokeAccess(assetID : Text, userID : Principal) : async Result.Result<(), Text> {
        // if (not isPermitted(caller)) {
        //     return #err("You are not permitted to perform this operation");
        // };

        // Update dataAccessTP
        switch (BTree.get(dataAccessTP, Text.compare, assetID)) {
            case null { /* Do nothing */ };
            case (?principals) {
                let updatedPrincipals = Array.filter(principals, func(p : Principal) : Bool { p != userID });
                ignore BTree.insert(dataAccessTP, Text.compare, assetID, updatedPrincipals);
            };
        };

        // Update dataAccessPT
        switch (BTree.get(dataAccessPT, Principal.compare, userID)) {
            case null { /* Do nothing */ };
            case (?assets) {
                let updatedAssets = Array.filter(assets, func(a : Text) : Bool { a != assetID });
                ignore BTree.insert(dataAccessPT, Principal.compare, userID, updatedAssets);
            };
        };

        #ok(());
    };

    // Helper function to check if a user has access to a specific asset
    public func hasAccess(userPrincipal : Principal, assetID : Text) : async Bool {
        switch (BTree.get(dataAccessTP, Text.compare, assetID)) {
            case null { false };
            case (?principals) {
                var found = false;
                // Check if userPrincipal has access to assetID
                label l for (p in (principals.vals())) {
                    // Changed label loop to for loop
                    if (p == userPrincipal) {
                        found := true;
                        break l; // Use the correct label and value
                    };
                };
                found; // Ensure this returns the correct value
            };
        };
    };

    public func getSymmetricKeyVerificationKey() : async Text {

        let { public_key } = await vetkd_system_api.vetkd_public_key({
            canister_id = null;
            derivation_path = Array.make(Text.encodeUtf8("symmetric_key"));
            key_id = { curve = #bls12_381; name = "test_key_1" };
        });
        Hex.encode(Blob.toArray(public_key));

    };

    public shared ({ caller }) func encrypted_symmetric_key_for_asset(requestor : Principal, assetID : Text, encryption_public_key : Blob) : async Result.Result<Text, Text> {
        // if (not isPermitted(caller)) {
        //     return #err("You are not permitted to perform this operation");
        // };

        let accessList = BTree.get(dataAccessTP, Text.compare, assetID);
        switch (accessList) {
            case (?principalList) {
                let found = Array.find<Principal>(principalList, func(p) { p == requestor });
                if (found == null) {
                    return #err("You don't have access to this data asset.");
                };
            };
            case (null) {
                return #err("Invalid unique ID or data asset not found.");
            };
        };

        let buf = Buffer.Buffer<Nat8>(32);
        buf.append(Buffer.fromArray(Blob.toArray(Text.encodeUtf8(assetID))));
        let derivation_id = Blob.fromArray(Buffer.toArray(buf));

        let { encrypted_key } = await vetkd_system_api.vetkd_encrypted_key({
            derivation_id;
            public_key_derivation_path = Array.make(Text.encodeUtf8("symmetric_key"));
            key_id = { curve = #bls12_381; name = "test_key_1" };
            encryption_public_key;
        });

        #ok(Hex.encode(Blob.toArray(encrypted_key)));
    };

    public shared query func getAllKeysDataAccessPT() : async Result.Result<[Principal], Text> {
        let keys = Buffer.Buffer<Principal>(0);
        for (entry in BTree.entries(dataAccessPT)) {
            keys.add(entry.0); // Collecting keys from dataAccessPT
        };
        #ok(Buffer.toArray(keys));
    };

    public shared query func getAllKeysDataAccessTP() : async Result.Result<[Text], Text> {
        let keys = Buffer.Buffer<Text>(0); // Initialize keys as a Buffer
        for (entry in BTree.entries(dataAccessTP)) {
            keys.add(entry.0); // Collecting keys from dataAccessTP
        };
        #ok(Buffer.toArray(keys));
    };
};
