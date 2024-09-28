import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Trie "mo:base/Trie";

actor class XPRewardSystem() {
    private type XPData = {
        totalXP : Nat;
        lastRewardTime : Time.Time;
        dailyUploads : Nat;
    };

    private stable var xpMap = Trie.empty<Text, XPData>();
    private let XP_PER_UPLOAD = 10; // XP awarded per upload
    private let MAX_DAILY_UPLOADS = 3; // Maximum number of rewarded uploads per day
    private let DAY_IN_NANOSECONDS : Int = 86_400_000_000_000; // 24 hours in nanoseconds

    public shared ({ caller = _caller }) func rewardXPForUpload(userID : Text) : async Result.Result<Nat, Text> {
        let currentTime = Time.now();

        switch (Trie.get(xpMap, keyText(userID), Text.equal)) {
            case (null) {
                // First upload for this user
                let newXPData : XPData = {
                    totalXP = XP_PER_UPLOAD;
                    lastRewardTime = currentTime;
                    dailyUploads = 1;
                };
                xpMap := Trie.put(xpMap, keyText(userID), Text.equal, newXPData).0;
                #ok(XP_PER_UPLOAD);
            };
            case (?existingXPData) {
                if (currentTime - existingXPData.lastRewardTime >= DAY_IN_NANOSECONDS) {
                    // It's a new day, reset daily uploads
                    let updatedXPData : XPData = {
                        totalXP = existingXPData.totalXP + XP_PER_UPLOAD;
                        lastRewardTime = currentTime;
                        dailyUploads = 1;
                    };
                    xpMap := Trie.put(xpMap, keyText(userID), Text.equal, updatedXPData).0;
                    #ok(XP_PER_UPLOAD);
                } else if (existingXPData.dailyUploads < MAX_DAILY_UPLOADS) {
                    // User can still earn XP today
                    let updatedXPData : XPData = {
                        totalXP = existingXPData.totalXP + XP_PER_UPLOAD;
                        lastRewardTime = currentTime;
                        dailyUploads = existingXPData.dailyUploads + 1;
                    };
                    xpMap := Trie.put(xpMap, keyText(userID), Text.equal, updatedXPData).0;
                    #ok(XP_PER_UPLOAD);
                } else {
                    // User has reached the daily upload limit
                    #err("Daily upload limit reached. No XP awarded.");
                };
            };
        };
    };

    public query func getUserXP(userID : Text) : async Result.Result<Nat, Text> {
        switch (Trie.get(xpMap, keyText(userID), Text.equal)) {
            case (null) { #err("User not found") };
            case (?xpData) { #ok(xpData.totalXP) };
        };
    };

    private func keyText(x : Text) : Trie.Key<Text> {
        { key = x; hash = Text.hash(x) };
    };
};
