import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import TrieMap "mo:base/TrieMap";
actor class IdentityManager() {
    private stable var identityMapEntries : [(Principal, (Text, Text))] = [];
    private var identityMap = TrieMap.fromEntries<Principal, (Text, Text)>(identityMapEntries.vals(), Principal.equal, Principal.hash);

    private stable var reverseIdentityMapEntries : [(Text, Principal)] = [];
    private var reverseIdentityMap = TrieMap.fromEntries<Text, Principal>(reverseIdentityMapEntries.vals(), Text.equal, Text.hash);

    system func preupgrade() {
        identityMapEntries := Iter.toArray(identityMap.entries());
        reverseIdentityMapEntries := Iter.toArray(reverseIdentityMap.entries());
    };

    system func postupgrade() {
        identityMap := TrieMap.fromEntries(identityMapEntries.vals(), Principal.equal, Principal.hash);
        reverseIdentityMap := TrieMap.fromEntries(reverseIdentityMapEntries.vals(), Text.equal, Text.hash);
    };

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

    public shared query func checkRegistrationByPrincipal(id : Principal) : async Result.Result<Text, Text> {
        switch (identityMap.get(id)) {
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
