import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";

actor class TokenManager() {
    let userTokens = HashMap.HashMap<Text, Nat>(0, Text.equal, Text.hash);

    public func earnTokens(userId : Text, amount : Nat) : async Result.Result<(), Text> {
        switch (userTokens.get(userId)) {
            case (?currentTokens) {
                userTokens.put(userId, currentTokens + amount);
            };
            case (null) {
                userTokens.put(userId, amount);
            };
        };
        #ok(());
    };

    public shared ({ caller }) func spendTokens(userId : Text, amount : Nat) : async Result.Result<(), Text> {
        switch (userTokens.get(userId)) {
            case (?currentTokens) {
                if (currentTokens >= amount) {
                    userTokens.put(userId, currentTokens - amount);
                    #ok(());
                } else {
                    #err("Insufficient tokens");
                };
            };
            case (null) {
                #err("User has no tokens");
            };
        };
    };

    public query func getTokenBalance(userId : Text) : async Nat {
        switch (userTokens.get(userId)) {
            case (?balance) { balance };
            case (null) { 0 };
        };
    };
};
