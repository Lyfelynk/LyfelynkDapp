import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Text "mo:base/Text";
import BTree "mo:stableheapbtreemap/BTree";

import Types "../Types";

actor class SharedActivityShard() {
    private var activityMap : BTree.BTree<Text, Types.sharedActivityInfo> = BTree.init<Text, Types.sharedActivityInfo>(null);
    private var userSharedMap : BTree.BTree<Text, [Text]> = BTree.init<Text, [Text]>(null);
    private var userReceivedMap : BTree.BTree<Text, [Text]> = BTree.init<Text, [Text]>(null);

    public shared func insertActivity(activity : Types.sharedActivityInfo) : async Result.Result<(), Text> {
        ignore BTree.insert(activityMap, Text.compare, activity.activityID, activity);

        let parts = Text.split(activity.assetID, #text("-"));
        switch (parts.next(), parts.next(), parts.next()) {
            case (?_, ?userID, ?_) {
                // Update userSharedMap
                switch (BTree.get(userSharedMap, Text.compare, userID)) {
                    case null {
                        ignore BTree.insert(userSharedMap, Text.compare, userID, [activity.activityID]);
                    };
                    case (?existingActivities) {
                        ignore BTree.insert(userSharedMap, Text.compare, userID, Array.append(existingActivities, [activity.activityID]));
                    };
                };
            };
            case _ {
                return #err("Invalid assetID format");
            };
        };

        // Update userReceivedMap
        switch (BTree.get(userReceivedMap, Text.compare, activity.usedSharedTo)) {
            case null {
                ignore BTree.insert(userReceivedMap, Text.compare, activity.usedSharedTo, [activity.activityID]);
            };
            case (?existingActivities) {
                ignore BTree.insert(userReceivedMap, Text.compare, activity.usedSharedTo, Array.append(existingActivities, [activity.activityID]));
            };
        };

        #ok(());
    };

    public shared query func getActivity(activityID : Text) : async Result.Result<Types.sharedActivityInfo, Text> {
        switch (BTree.get(activityMap, Text.compare, activityID)) {
            case (?activity) { #ok(activity) };
            case null { #err("Activity not found") };
        };
    };

    public shared query func getUserSharedActivities(userID : Text) : async Result.Result<[Types.sharedActivityInfo], Text> {
        switch (BTree.get(userSharedMap, Text.compare, userID)) {
            case (?activityIDs) {
                let activities = Array.mapFilter<Text, Types.sharedActivityInfo>(
                    activityIDs,
                    func(id) {
                        BTree.get(activityMap, Text.compare, id);
                    },
                );
                #ok(activities);
            };
            case null { #ok([]) };
        };
    };

    public shared query func getUserReceivedActivities(userID : Text) : async Result.Result<[Types.sharedActivityInfo], Text> {
        switch (BTree.get(userReceivedMap, Text.compare, userID)) {
            case (?activityIDs) {
                let activities = Array.mapFilter<Text, Types.sharedActivityInfo>(
                    activityIDs,
                    func(id) {
                        BTree.get(activityMap, Text.compare, id);
                    },
                );
                #ok(activities);
            };
            case null { #ok([]) };
        };
    };

    // Other necessary functions...
};
