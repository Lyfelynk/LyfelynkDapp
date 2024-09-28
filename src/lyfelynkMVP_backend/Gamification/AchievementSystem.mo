import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Text "mo:base/Text";
actor class AchievementSystem() {
    let userAchievements = HashMap.HashMap<Text, [Text]>(0, Text.equal, Text.hash);
    let userSocialScores = HashMap.HashMap<Text, Nat>(0, Text.equal, Text.hash);

    public func awardAchievement(userId : Text, achievementId : Text) : async Result.Result<(), Text> {
        switch (userAchievements.get(userId)) {
            case (?achievements) {
                if (Array.find(achievements, func(a : Text) : Bool { a == achievementId }) != null) {
                    #err("Achievement already awarded");
                } else {
                    userAchievements.put(userId, Array.append(achievements, [achievementId]));
                    #ok(());
                };
            };
            case (null) {
                userAchievements.put(userId, [achievementId]);
                #ok(());
            };
        };
    };

    public func updateSocialScore(userId : Text) : async Result.Result<Nat, Text> {
        switch (userAchievements.get(userId)) {
            case (?achievements) {
                let newScore = achievements.size() * 10; // Simple scoring: 10 points per achievement
                userSocialScores.put(userId, newScore);
                #ok(newScore);
            };
            case (null) {
                #err("User has no achievements");
            };
        };
    };

    public query func getUserAchievements(userId : Text) : async [Text] {
        switch (userAchievements.get(userId)) {
            case (?achievements) { achievements };
            case (null) { [] };
        };
    };

    public query func getSocialScore(userId : Text) : async Nat {
        switch (userSocialScores.get(userId)) {
            case (?score) { score };
            case (null) { 0 };
        };
    };
};
