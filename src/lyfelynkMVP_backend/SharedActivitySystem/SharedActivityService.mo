import Array "mo:base/Array";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";

import IdentityManager "../IdentityManager/IdentityManager";
import Types "../Types";
import SharedActivityShardManager "SharedActivityShardManager";

actor class SharedActivityService() {
    private let shardManager : SharedActivityShardManager.SharedActivityShardManager = actor ("ajuq4-ruaaa-aaaaa-qaaga-cai"); // Replace with actual canister ID
    private let identityManager : IdentityManager.IdentityManager = actor ("by6od-j4aaa-aaaaa-qaadq-cai"); // Replace with actual canister ID

    public shared func recordSharedActivity(caller : Principal, assetID : Text, recipientID : Text, sharedType : Types.SharedType) : async Result.Result<(), Text> {
        let senderIDResult = await identityManager.getIdentity(caller);
        switch (senderIDResult) {
            case (#ok((senderID, _))) {
                let activityIDResult = await shardManager.getNextActivityID(senderID);
                switch (activityIDResult) {
                    case (#ok(activityID)) {
                        let activity : Types.sharedActivityInfo = {
                            activityID = activityID;
                            assetID = assetID;
                            usedSharedTo = recipientID;
                            time = Int.abs(Time.now());
                            sharedType = sharedType;
                        };

                        let shardResult = await shardManager.getShard(activityID);
                        switch (shardResult) {
                            case (#ok(shard)) {
                                let result = await shard.insertActivity(activity);
                                switch (result) {
                                    case (#ok(_)) {
                                        #ok(());
                                    };
                                    case (#err(e)) { #err(e) };
                                };
                            };
                            case (#err(e)) { #err(e) };
                        };
                    };
                    case (#err(e)) { #err("Error getting activity ID: " # e) };
                };
            };
            case (#err(e)) { #err("Error getting sender ID: " # e) };
        };
    };

    public shared ({ caller }) func getSharedActivities() : async Result.Result<[Types.sharedActivityInfo], Text> {
        let userIDResult = await identityManager.getIdentity(caller);
        switch (userIDResult) {
            case (#ok((userID, _))) {
                let userShardsResult = await shardManager.getUserShards(userID);
                switch (userShardsResult) {
                    case (#ok(userShards)) {
                        var allActivities : [Types.sharedActivityInfo] = [];
                        for (shard in userShards.vals()) {
                            let activitiesResult = await shard.getUserSharedActivities(userID);
                            switch (activitiesResult) {
                                case (#ok(activities)) {
                                    allActivities := Array.append(allActivities, activities);
                                };
                                case (#err(_)) {}; // Skip if error
                            };
                        };
                        #ok(allActivities);
                    };
                    case (#err(e)) { #err("Error getting user shards: " # e) };
                };
            };
            case (#err(e)) { #err("Error getting user ID: " # e) };
        };
    };

    public shared func getReceivedActivities(caller : Principal) : async Result.Result<[Types.sharedActivityInfo], Text> {
        let userIDResult = await identityManager.getIdentity(caller);
        switch (userIDResult) {
            case (#ok((userID, _))) {
                var allActivities : [Types.sharedActivityInfo] = [];
                var currentShard = 1;
                label l loop {
                    let shardResult = await shardManager.getShard(Nat.toText(currentShard));
                    switch (shardResult) {
                        case (#ok(shard)) {
                            let activitiesResult = await shard.getUserReceivedActivities(userID);
                            switch (activitiesResult) {
                                case (#ok(activities)) {
                                    allActivities := Array.append(allActivities, activities);
                                };
                                case (#err(_)) {}; // Skip if error
                            };
                            currentShard += 1;
                        };
                        case (#err(_)) { break l };
                    };
                };
                #ok(allActivities);
            };
            case (#err(e)) { #err("Error getting user ID: " # e) };
        };
    };

    // Other necessary functions...
    public shared func getSharedActivity(activityID : Text) : async Result.Result<Types.sharedActivityInfo, Text> {
        let shardResult = await shardManager.getShard(activityID);
        switch (shardResult) {
            case (#ok(shard)) {
                await shard.getActivity(activityID);
            };
            case (#err(e)) { #err("Error getting shard: " # e) };
        };
    };
};
