// GamificationSystem.mo

import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Error "mo:base/Error";
import Float "mo:base/Float";
import Hash "mo:base/Hash";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import TrieMap "mo:base/TrieMap";
import CandyTypesLib "mo:candy_0_3_0/types";
import ICRC7 "mo:icrc7-mo";

import IdentityManager "../IdentityManager/IdentityManager";
import Types "../Types";
import VisitManager "./VisitManager";
import WellnessAvatarNFT "./WellnessAvatarNFT";

actor class GamificationSystem() {
    type Account = ICRC7.Account;
    type NFT = ICRC7.NFT;
    type SetNFTError = {
        #NonExistingTokenId;
        #TokenExists;
        #GenericError : { error_code : Nat; message : Text };
        #TooOld;
        #CreatedInFuture : { ledger_time : Nat64 };
    };

    type SetNFTRequest = ICRC7.SetNFTRequest;
    type SetNFTResult = {
        #Ok : ?Nat;
        #Err : SetNFTError;
        #GenericError : { error_code : Nat; message : Text };
    };
    type Value = ICRC7.Value;

    private let wellnessAvatarNFT : WellnessAvatarNFT.WellnessAvatarNFT = actor (Types.wellnessAvatarNFTCanisterID);
    private let visitManager : VisitManager.VisitManager = actor (Types.visitManagerCanisterID);

    private stable var userTokensEntries : [(Text, Nat)] = [];
    private var userTokens : TrieMap.TrieMap<Text, Nat> = TrieMap.fromEntries(userTokensEntries.vals(), Text.equal, Text.hash);

    private stable var avatarAttributesEntries : [(Nat, AvatarAttributes)] = [];
    private var avatarAttributes : TrieMap.TrieMap<Nat, AvatarAttributes> = TrieMap.fromEntries(avatarAttributesEntries.vals(), Nat.equal, Hash.hash);

    private stable var avatarHPEntries : [(Nat, Nat)] = [];
    private var avatarHP : TrieMap.TrieMap<Nat, Nat> = TrieMap.fromEntries(avatarHPEntries.vals(), Nat.equal, Hash.hash);

    private stable var userPrincipalMapEntries : [(Text, Principal)] = [];
    private var userPrincipalMap : TrieMap.TrieMap<Text, Principal> = TrieMap.fromEntries(userPrincipalMapEntries.vals(), Text.equal, Text.hash);

    private let identityManager : IdentityManager.IdentityManager = actor (Types.identityManagerCanisterID);

    private type AvatarAttributes = {
        energy : Nat;
        focus : Nat;
        vitality : Nat;
        resilience : Nat;
        quality : Text;
        avatarType : Text;
        level : Nat;
    };

    private type AvatarMetadata = {
        name : Text;
        description : Text;
        attributes : AvatarAttributes;
    };

    private let MAX_HP = 100;
    private let BASE_TOKENS_PER_VISIT = 10;

    // Default avatar attributes
    private func defaultAttributes(avatarType : Text) : AvatarAttributes {
        {
            energy = 100;
            focus = 100;
            vitality = 100;
            resilience = 100;
            quality = "Common";
            avatarType = avatarType;
            level = 1;
        };
    };

    // Minting function with default values
    public shared ({ caller }) func mintWellnessAvatar(mintNFTPrincipal : Text, memo : ?Blob, avatarType : Text, imageURL : Text) : async Result.Result<[SetNFTResult], ICRC7.TransferError> {
        let currentTokenId = await wellnessAvatarNFT.icrc7_total_supply();
        let tokenId = currentTokenId + 1;

        let defaultMetadata = createDefaultMetadata(tokenId, avatarType, defaultAttributes(avatarType), imageURL);

        let request : SetNFTRequest = [{
            owner = ?{ owner = caller; subaccount = null };
            metadata = defaultMetadata;
            memo = memo;
            override = true;
            token_id = tokenId;
            created_at_time = null;
        }];
        avatarAttributes.put(tokenId, defaultAttributes(avatarType));
        avatarHP.put(tokenId, MAX_HP);
        let result = await wellnessAvatarNFT.icrcX_mint(caller, request);
        let transferResult = await wellnessAvatarNFT.icrc7_transfer(caller, [{ from_subaccount = null; to = { owner = Principal.fromText(mintNFTPrincipal); subaccount = null }; token_id = tokenId; memo = memo; created_at_time = null }]);
        switch (transferResult[0]) {
            case (? #Ok(_)) { #ok(result) };
            case (? #Err(err)) { return #err(err) };
            case (null) { return (#ok(result)) };
        };

    };

    // Helper function to create default metadata
    private func createDefaultMetadata(tokenId : Nat, avatarType : Text, attributes : AvatarAttributes, imageURL : Text) : CandyTypesLib.CandyShared {
        #Class([
            {
                immutable = false;
                name = "name";
                value = #Text("Wellness Avatar #" # Nat.toText(tokenId));
            },
            {
                immutable = false;
                name = "description";
                value = #Text("A " # avatarType # " Avatar in the Lyfelynk ecosystem");
            },
            {
                immutable = false;
                name = "image";
                value = #Text(imageURL);
            },
            {
                immutable = false;
                name = "attributes";
                value = #Class([
                    {
                        immutable = false;
                        name = "energy";
                        value = #Nat(attributes.energy);
                    },
                    {
                        immutable = false;
                        name = "focus";
                        value = #Nat(attributes.focus);
                    },
                    {
                        immutable = false;
                        name = "vitality";
                        value = #Nat(attributes.vitality);
                    },
                    {
                        immutable = false;
                        name = "resilience";
                        value = #Nat(attributes.resilience);
                    },
                    {
                        immutable = false;
                        name = "quality";
                        value = #Text(attributes.quality);
                    },
                    {
                        immutable = false;
                        name = "avatarType";
                        value = #Text(attributes.avatarType);
                    },
                    {
                        immutable = false;
                        name = "level";
                        value = #Nat(attributes.level);
                    },
                ]);
            },
        ]);
    };

    // Level up function
    public shared ({ caller }) func levelUpAvatar(tokenId : Nat) : async Result.Result<[ICRC7.UpdateNFTResult], Text> {

        switch (avatarAttributes.get(tokenId)) {
            case (?attributes) {
                let existingAttributes = attributes;
                let updatedAttributes = {
                    energy = existingAttributes.energy + 100;
                    focus = existingAttributes.focus + 100;
                    vitality = existingAttributes.vitality + 100;
                    resilience = existingAttributes.resilience + 100;
                    quality = switch (existingAttributes.quality) {
                        case ("Common") { "Uncommon" };
                        case ("Uncommon") { "Rare" };
                        case ("Rare") { "Epic" };
                        case ("Epic") { "Legendary" };
                        case ("Legendary") { "Mythic" };
                        case ("Mythic") { "Mythic" };
                        case (_) { "Common" };
                    };
                    avatarType = existingAttributes.avatarType;
                    level = existingAttributes.level + 1;
                };
                let tokensRequired = switch (existingAttributes.quality) {
                    case ("Common") 100;
                    case ("Uncommon") 200;
                    case ("Rare") 300;
                    case ("Epic") 400;
                    case ("Legendary") 500;
                    case ("Mythic") 600;
                    case (_) 100;
                };
                ignore await spendTokens(caller, tokensRequired);

                avatarAttributes.put(tokenId, updatedAttributes);
                let response = await wellnessAvatarNFT.icrcX_update(Principal.fromText(Types.admin), tokenId, updatedAttributes);
                switch (response) {
                    case (#ok(val)) { #ok(val) };
                    case (#err(err)) { #err(err) };
                };
            };
            case (null) { #err("Avatar not found") };
        };
    };

    public shared ({ caller }) func initiateVisit(idToVisit : Text, duration : Nat, avatarId : Nat) : async Result.Result<Nat, Text> {
        let result = await visitManager.initiateVisit(caller, idToVisit, Int.abs(Time.now()), duration, avatarId);
        switch (result) {
            case (#ok(visitId)) {
                // Update avatar HP here
                ignore await depleteHP(Nat.toText(avatarId), 10);
                #ok(visitId);
            };
            case (#err(e)) #err(e);
        };
    };

    public shared ({ caller }) func completeVisit(visitId : Nat, avatarId : Nat) : async Result.Result<Text, Text> {
        // Get the owner (principal) of the avatar
        let ownerResult = await wellnessAvatarNFT.icrc7_owner_of([avatarId]);

        switch (ownerResult[0]) {
            case (?owner) {
                switch (owner) {
                    case ({ owner = principal; subaccount = _ }) {
                        let userIdResult = await getUserId(principal);

                        switch (userIdResult) {
                            case (#ok(userId)) {
                                let result = await visitManager.updateVisitStatus(caller, visitId, #Completed);
                                switch (result) {
                                    case (#ok(_)) {
                                        await updateAvatarAfterVisit(avatarId, userId);
                                        #ok("Visit completed: " # Nat.toText(visitId));
                                    };
                                    case (#err(e)) {
                                        #err(e);
                                    };
                                };
                            };
                            case (#err(e)) {
                                #err("Error getting user ID: " # e);
                            };
                        };
                    };

                };
            };
            case (null) {
                #err("Avatar not found");
            };
        };
    };

    public shared ({ caller }) func transferNFT(tokenId : Nat, newOwner : Text) : async [?ICRC7.TransferResult] {

        let transferArgs : ICRC7.TransferArg = {
            from_subaccount = null;
            to = { owner = Principal.fromText(newOwner); subaccount = null };
            token_id = tokenId; // Assuming you have a tokenId variable
            memo = null;
            created_at_time = null;
        };
        await wellnessAvatarNFT.icrc7_transfer(caller, [transferArgs]);

    };

    // HP System functions
    private func depleteHP(avatarId : Text, amount : Nat) : async Result.Result<Nat, Text> {
        switch (Nat.fromText(avatarId)) {
            case (?id) {
                switch (avatarHP.get(id)) {
                    case (?currentHP) {
                        let newHP = Nat.max(0, currentHP - amount);
                        avatarHP.put(id, newHP);
                        #ok(newHP);
                    };
                    case null { #err("Avatar HP not found") };
                };
            };
            case null { #err("Invalid avatar ID") };
        };
    };

    public shared ({ caller }) func restoreHP(avatarId : Nat, amount : Nat) : async Result.Result<Nat, Text> {

        switch (avatarHP.get(avatarId)) {
            case (?currentHP) {
                let tokensRequired = amount;
                let result = await spendTokens(caller, tokensRequired);
                switch (result) {
                    case (#ok(_)) {
                        let newHP = Nat.min(MAX_HP, currentHP + amount);
                        avatarHP.put(avatarId, newHP);
                        #ok(newHP);
                    };
                    case (#err(e)) { #err(e) };
                };
            };
            case null { #err("Avatar HP not found") };
        };

    };

    // Token management functions
    private func earnTokens(userId : Text, amount : Nat) : async Result.Result<(), Text> {
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

    private func spendTokens(caller : Principal, amount : Nat) : async Result.Result<(), Text> {
        let userIdResult = await getUserId(caller);
        switch (userIdResult) {
            case (#ok(userId)) {
                switch (userTokens.get(userId)) {
                    case (?currentTokens) {
                        if (currentTokens >= amount) {
                            userTokens.put(userId, currentTokens - amount);
                            #ok(());
                        } else {
                            #err("Insufficient tokens");
                        };
                    };
                    case null { #err("User has no tokens") };
                };
            };
            case (#err(e)) { #err("Error getting user ID: " # e) };
        };
    };

    // Query functions for frontend integration
    public shared ({ caller }) func getUserTokens() : async Result.Result<?Nat, Text> {
        let userIdResult = await getUserId(caller);
        switch (userIdResult) {
            case (#ok(userId)) { #ok(userTokens.get(userId)) };
            case (#err(e)) { #err("Error getting user ID: " # e) };
        };
    };

    public func getUserAvatars(userPrincipalId : Text) : async [Nat] {
        await wellnessAvatarNFT.icrc7_tokens_of({ owner = Principal.fromText(userPrincipalId); subaccount = null }, null, null);
    };

    public shared ({ caller }) func getUserAvatarsSelf() : async Result.Result<[(Nat, ?[(Text, ICRC7.Value)])], Text> {
        let userIdResult = await getUserId(caller);
        switch (userIdResult) {
            case (#ok(_userId)) {
                let tokenIds = await wellnessAvatarNFT.icrc7_tokens_of({ owner = caller; subaccount = null }, null, null);
                let metadata = await wellnessAvatarNFT.icrc7_token_metadata(tokenIds);

                #ok(Array.tabulate<(Nat, ?[(Text, ICRC7.Value)])>(tokenIds.size(), func(i) { (tokenIds[i], metadata[i]) }));
            };
            case (#err(e)) {
                #err("Error getting user ID: " # e);
            };
        };
    };

    public query func getAvatarAttributes(tokenId : Nat) : async Result.Result<(AvatarAttributes, Nat), Text> {
        switch (avatarAttributes.get(tokenId), avatarHP.get(tokenId)) {
            case (?attributes, ?hp) { #ok((attributes, hp)) };
            case (_, _) { #err("Avatar not found") };
        };
    };

    public shared query ({ caller }) func whoami() : async Text {
        Principal.toText(caller);
    };

    public shared ({ caller }) func rejectVisit(visitId : Nat) : async Result.Result<(), Text> {
        let result = await visitManager.updateVisitStatus(caller, visitId, #Rejected);
        switch (result) {
            case (#ok(_)) { #ok(()) };
            case (#err(e)) { #err(e) };
        };
    };

    private func updateAvatarAfterVisit(avatarId : Nat, userId : Text) : async () {
        switch (avatarAttributes.get(avatarId)) {
            case (?attributes) {
                let tokensEarned = calculateTokensForVisit(attributes.quality, avatarId);
                ignore await earnTokens(userId, tokensEarned);
                ignore await depleteHP(Nat.toText(avatarId), 10);
            };
            case (null) {};
        };
    };

    private func calculateTokensForVisit(quality : Text, avatarId : Nat) : Nat {
        let qualityMultiplier = switch (quality) {
            case "Common" 1;
            case "Uncommon" 2;
            case "Rare" 3;
            case "Epic" 4;
            case "Legendary" 5;
            case "Mythic" 6;
            case _ 1;
        };
        let currentHP = switch (avatarHP.get(avatarId)) {
            case (?hp) hp;
            case null MAX_HP;
        };
        let hpFactor = Float.fromInt(currentHP) / Float.fromInt(MAX_HP);
        Int.abs(Float.toInt((Float.fromInt(BASE_TOKENS_PER_VISIT * qualityMultiplier) * hpFactor))) * 13;
    };

    system func preupgrade() {
        userTokensEntries := Iter.toArray(userTokens.entries());
        avatarAttributesEntries := Iter.toArray(avatarAttributes.entries());
        avatarHPEntries := Iter.toArray(avatarHP.entries());
        userPrincipalMapEntries := Iter.toArray(userPrincipalMap.entries());
    };

    system func postupgrade() {
        userTokens := TrieMap.fromEntries(userTokensEntries.vals(), Text.equal, Text.hash);
        avatarAttributes := TrieMap.fromEntries(avatarAttributesEntries.vals(), Nat.equal, Hash.hash);
        avatarHP := TrieMap.fromEntries(avatarHPEntries.vals(), Nat.equal, Hash.hash);
        userPrincipalMap := TrieMap.fromEntries(userPrincipalMapEntries.vals(), Text.equal, Text.hash);
    };

    // Function to register a user with their principal
    public shared ({ caller }) func registerUser() : async Result.Result<(), Text> {
        let userIdResult = await getUserId(caller);
        switch (userIdResult) {
            case (#ok(userId)) {
                switch (userPrincipalMap.get(userId)) {
                    case (?_) { #err("User already registered") };
                    case null {
                        userPrincipalMap.put(userId, caller);
                        #ok(());
                    };
                };
            };
            case (#err(e)) {
                #err("Error getting user ID: " # e);
            };
        };
    };

    private func getUserId(principal : Principal) : async Result.Result<Text, Text> {
        try {
            let result = await identityManager.getIdentity(principal);
            switch (result) {
                case (#ok((id, _))) { #ok(id) };
                case (#err(e)) { #err(e) };
            };
        } catch (error) {
            #err("Error calling identity manager: " # Error.message(error));
        };
    };

};
