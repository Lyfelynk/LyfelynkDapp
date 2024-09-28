import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Text "mo:base/Text";

actor class HPSystem() {
    let userHP = HashMap.HashMap<Text, Nat>(0, Text.equal, Text.hash);

    public func depleteHP(userId : Text, amount : Nat) : async Result.Result<(), Text> {
        switch (userHP.get(userId)) {
            case (?currentHP) {
                let newHP = Nat.max(0, currentHP - amount);
                userHP.put(userId, newHP);
                #ok(());
            };
            case (null) {
                userHP.put(userId, 100 - amount);
                #ok(());
            };
        };
    };

    public shared ({ caller = _callerPrincipal }) func restoreHP(userId : Text, amount : Nat) : async Result.Result<(), Text> {
        switch (userHP.get(userId)) {
            case (?currentHP) {
                let newHP = Nat.min(100, currentHP + amount);
                userHP.put(userId, newHP);
                #ok(());
            };
            case (null) {
                userHP.put(userId, Nat.min(100, amount));
                #ok(());
            };
        };
    };

    public func updateHPFromRatings(userId : Text, rating : Int) : async Result.Result<(), Text> {
        let hpChange = if (rating > 0) { 5 } else { -5 };
        switch (userHP.get(userId)) {
            case (?currentHP) {
                let newHP = Nat.max(0, Nat.min(100, Int.abs((currentHP) + hpChange)));
                userHP.put(userId, newHP);
                #ok(());
            };
            case (null) {
                userHP.put(userId, Nat.max(0, Nat.min(100, 100 + Int.abs(hpChange))));
                #ok(());
            };
        };
    };
};
