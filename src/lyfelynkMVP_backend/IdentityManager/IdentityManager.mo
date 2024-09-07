import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import TrieMap "mo:base/TrieMap";

actor class IdentityManager() {
    private let identityMap = TrieMap.TrieMap<Principal, (Text, Text)>(Principal.equal, Principal.hash);
    private let reverseIdentityMap = TrieMap.TrieMap<Text, Principal>(Text.equal, Text.hash);

    public func registerIdentity(principal : Principal, id : Text, userType : Text) : async Result.Result<(), Text> {
        identityMap.put(principal, (id, userType));
        reverseIdentityMap.put(id, principal);
        #ok(());
    };

    public query func getIdentity(principal : Principal) : async Result.Result<(Text, Text), Text> {
        switch (identityMap.get(principal)) {
            case (?identity) { #ok(identity) };
            case null { #err("Identity not found") };
        };
    };

    public shared query ({ caller }) func checkRegistration() : async Result.Result<Text, Text> {
        switch (identityMap.get(caller)) {
            case (?identity) { #ok(identity.1) };
            case null { #err("Identity not found") };
        };
    };

    public query func getPrincipalByID(id : Text) : async Result.Result<Principal, Text> {
        switch (reverseIdentityMap.get(id)) {
            case (?principal) { #ok(principal) };
            case null { #err("Principal not found for given ID") };
        };
    };

    public shared func removeIdentity(id : Text) : async Result.Result<(), Text> {
        // Implementation of removeIdentity
        switch (reverseIdentityMap.get(id)) {
            case (?principal) {
                identityMap.delete(principal);
                reverseIdentityMap.delete(id);
                #ok(());
            };
            case null {
                #err("Identity not found");

            };
        };
    };
};
