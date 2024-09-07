import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";

import IdentityManager "../IdentityManager/IdentityManager";
import Types "../Types";
import DataAssetShardManager "DataAssetShardManager";

actor DataAssetService {
    type DataAsset = Types.DataAsset;
    type DataAssetInfo = Types.DataAssetInfo;
    type SharedType = Types.SharedType;
    type sharedActivityInfo = Types.sharedActivityInfo;
    type DataAssetShardManager = DataAssetShardManager.DataAssetShardManager;
    type IdentityManager = IdentityManager.IdentityManager;
    let ShardManager : DataAssetShardManager = actor ("be2us-64aaa-aaaaa-qaabq-cai"); // Replace with actual canister ID
    let identityManager : IdentityManager = actor ("by6od-j4aaa-aaaaa-qaadq-cai"); // Replace with actual canister ID

    public shared ({ caller }) func uploadDataAsset(asset : DataAsset) : async Result.Result<Text, Text> {
        let userIDResult = await getUserID(caller);
        switch (userIDResult) {
            case (#ok(userID)) {
                let assetID = await ShardManager.getNextAssetID();
                let timestamp = Int.toText(Time.now());

                let shardResult = await ShardManager.getShard(assetID);
                switch (shardResult) {
                    case (#ok(shard)) {
                        let updatedAsset = {
                            asset with assetID = assetID # "-" # userID # "-" # timestamp
                        };
                        let result = await shard.insertDataAsset(userID, timestamp, updatedAsset);
                        switch (result) {
                            case (#ok(_)) {
                                let shardID = await ShardManager.getShardIDFromAssetID(assetID);
                                switch (shardID) {
                                    case (#ok(id)) {
                                        let updateResult = await ShardManager.updateUserShardMap(userID, id);
                                        switch (updateResult) {
                                            case (#ok(_)) {
                                                return #ok(updatedAsset.assetID);
                                            };
                                            case (#err(e)) {
                                                return #err("Failed to update user shard map: " # e);
                                            };
                                        };
                                    };
                                    case (#err(e)) { return #err(e) };
                                };
                            };
                            case (#err(e)) { return #err(e) };
                        };
                    };
                    case (#err(e)) { return #err(e) };
                };
            };
            case (#err(e)) { return #err("User not found: " # e) };
        };
    };

    public shared ({ caller }) func getUserDataAssets() : async Result.Result<[(Text, DataAsset)], Text> {
        let userIDResult = await ShardManager.getUserID(caller);
        switch (userIDResult) {
            case (#ok(userID)) {
                let shardsResult = await ShardManager.getUserShards(userID);
                switch (shardsResult) {
                    case (#ok(shards)) {
                        let allAssets = Buffer.Buffer<(Text, DataAsset)>(0);
                        for (shard in shards.vals()) {
                            let assetsResult = await shard.getUserDataAssets(userID);
                            switch (assetsResult) {
                                case (#ok(assets)) {
                                    allAssets.append(Buffer.fromArray(assets));
                                };
                                case (#err(_)) { /* Skip if error */ };
                            };
                        };
                        #ok(Buffer.toArray(allAssets));
                    };
                    case (#err(e)) { #err(e) };
                };
            };
            case (#err(e)) { #err("User not found: " # e) };
        };
    };

    public shared ({ caller }) func getDataAsset(assetID : Text) : async Result.Result<DataAsset, Text> {
        let shardResult = await ShardManager.getShard(assetID);
        switch (shardResult) {
            case (#ok(shard)) {
                let hasAccessResult = await shard.hasAccess(caller, assetID);
                switch (hasAccessResult) {
                    case (true) {
                        let parts = Text.split(assetID, #text("-"));
                        switch (parts.next(), parts.next(), parts.next()) {
                            case (?_assetNum, ?userID, ?timestamp) {
                                let assetResult = await shard.getDataAsset(userID, timestamp);
                                switch (assetResult) {
                                    case (#ok(asset)) { return #ok(asset) };
                                    case (#err(e)) { return #err(e) };
                                };
                            };
                            case _ { return #err("Invalid asset ID format") };
                        };
                    };
                    case (false) {
                        return #err("Caller does not have access to this asset");
                    };
                };
            };
            case (#err(e)) { return #err(e) };
        };
    };

    public shared ({ caller }) func updateDataAsset(assetID : Text, updatedAsset : DataAsset) : async Result.Result<(), Text> {
        if (not (assetID == updatedAsset.assetID)) {
            return #err("Asset ID are not the same");
        };
        let userIDResult = await getUserID(caller);
        switch (userIDResult) {
            case (#ok(userID)) {
                let shardResult = await ShardManager.getShard(assetID);
                switch (shardResult) {
                    case (#ok(shard)) {
                        let parts = Text.split(assetID, #text("-"));
                        switch (parts.next(), parts.next(), parts.next()) {
                            case (?_assetNum, ?assetUserID, ?timestamp) {
                                if (userID == assetUserID) {
                                    let updateResult = await shard.updateDataAsset(userID, timestamp, updatedAsset);
                                    switch (updateResult) {
                                        case (#ok(_)) { return #ok(()) };
                                        case (#err(e)) { return #err(e) };
                                    };
                                } else {
                                    return #err("Only the owner can update this asset");
                                };
                            };
                            case _ { return #err("Invalid asset ID format") };
                        };
                    };
                    case (#err(e)) { return #err(e) };
                };
            };
            case (#err(e)) { return #err("Error getting caller ID: " # e) };
        };
    };

    public shared ({ caller }) func shareDataAsset(assetID : Text, recipientID : Text, sharedType : SharedType) : async Result.Result<(), Text> {
        let userIDResult = await ShardManager.getUserID(caller);
        switch (userIDResult) {
            case (#ok(callerID)) {
                let parts = Text.split(assetID, #text("-"));
                switch (parts.next(), parts.next(), parts.next()) {
                    case (?assetNum, ?ownerID, ?timestamp) {
                        if (callerID != ownerID) {
                            return #err("Only the owner can share this asset");
                        };
                        let shardResult = await ShardManager.getShard(assetNum);
                        switch (shardResult) {
                            case (#ok(shard)) {
                                let recipientPrincipal = await ShardManager.getPrincipal(recipientID);
                                switch (recipientPrincipal) {
                                    case (#ok(principal)) {
                                        let grantResult = await shard.grantAccess(assetID, principal);
                                        switch (grantResult) {
                                            case (#ok(_)) {
                                                let sharedInfo : sharedActivityInfo = {
                                                    activityID = "";
                                                    assetID = assetID;
                                                    usedSharedTo = recipientID;
                                                    time = Int.abs(Time.now());
                                                    sharedType = sharedType;
                                                };

                                                #ok(());
                                            };
                                            case (#err(e)) { #err(e) };
                                        };
                                    };
                                    case (#err(e)) {
                                        #err("Recipient not found: " # e);
                                    };
                                };
                            };
                            case (#err(e)) { #err(e) };
                        };
                    };
                    case _ { #err("Invalid asset ID format") };
                };
            };
            case (#err(e)) { #err("Error getting caller ID: " # e) };
        };
    };

    // Utility functions
    public shared func getUserID(principal : Principal) : async Result.Result<Text, Text> {
        let identityResult = await identityManager.getIdentity(principal);
        switch (identityResult) {
            case (#ok((id, _))) { #ok(id) };
            case (#err(e)) { #err(e) };
        };
    };

    public shared ({ caller }) func updateDataAssetShardWasmModule(wasmModule : [Nat8]) : async Result.Result<(), Text> {
        let result = await ShardManager.updateWasmModule(wasmModule);

        switch (result) {
            case (#ok(())) {
                #ok(());
            };
            case (#err(e)) {
                #err("Failed to update WASM module: " # e);
            };
        };
    };

    public shared ({ caller }) func getSymmetricKeyVerificationKey(assetID : Text) : async Result.Result<Text, Text> {
        let shardResult = await ShardManager.getShard(assetID);
        switch (shardResult) {
            case (#ok(shard)) {
                #ok(await shard.getSymmetricKeyVerificationKey());
            };
            case (#err(e)) {
                #err("Error getting shard: " # e);
            };
        };
    };

    public shared ({ caller }) func getEncryptedSymmetricKeyForAsset(assetID : Text, encryption_public_key : Blob) : async Result.Result<Text, Text> {
        let shardResult = await ShardManager.getShard(assetID);
        switch (shardResult) {
            case (#ok(shard)) {
                await shard.encrypted_symmetric_key_for_asset(caller, assetID, encryption_public_key);
            };
            case (#err(e)) {
                #err("Error getting shard: " # e);
            };
        };
    };
};
