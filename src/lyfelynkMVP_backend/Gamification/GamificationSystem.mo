// GamificationSystem.mo

import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Float "mo:base/Float";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import CandyTypesLib "mo:candy_0_3_0/types";
import ICRC7 "mo:icrc7-mo";

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
    private let visitManager : VisitManager.VisitManager = actor ("VISIT_MANAGER_CANISTER_ID");

    private let userTokens = HashMap.HashMap<Text, Nat>(0, Text.equal, Text.hash);
    private let userAchievements = HashMap.HashMap<Text, [Text]>(0, Text.equal, Text.hash);
    private let userSocialScores = HashMap.HashMap<Text, Nat>(0, Text.equal, Text.hash);

    private let avatarAttributes = HashMap.HashMap<Nat, AvatarAttributes>(
        0,
        Nat.equal,
        func(n : Nat) : Nat32 {
            Nat32.fromNat(n);
        },
    );

    private let avatarHP = HashMap.HashMap<Nat, Nat>(0, Nat.equal, func(n : Nat) : Nat32 { Nat32.fromNat(n) });

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
    private let QUALITY_MULTIPLIERS = [
        ("Common", 1),
        ("Uncommon", 2),
        ("Rare", 3),
        ("Epic", 4),
        ("Legendary", 5),
        ("Mythic", 6),
    ];

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
    public shared ({ caller }) func mintWellnessAvatar(mintNFTPrincipal : Text, memo : ?Blob, avatarType : Text, imageURL : Text) : async [SetNFTResult] {
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
        await wellnessAvatarNFT.icrcX_mint(Principal.fromText(mintNFTPrincipal), request);
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

                avatarAttributes.put(tokenId, updatedAttributes);
                let response = await wellnessAvatarNFT.icrcX_update(caller, tokenId, updatedAttributes);
                switch (response) {
                    case (#ok(val)) { #ok(val) };
                    case (#err(err)) { #err(err) };
                };
            };
            case (null) { #err("Avatar not found") };
        };
    };

    // HP System functions
    public func depleteHP(avatarId : Text, amount : Nat) : async Result.Result<(), Text> {
        switch (Nat.fromText(avatarId)) {
            case (?id) {
                switch (avatarHP.get(id)) {
                    case (?currentHP) {
                        let newHP = Nat.max(0, currentHP - amount);
                        avatarHP.put(id, newHP);
                        #ok(());
                    };
                    case null { return #err("Avatar HP not found") };
                };
            };
            case null { return #err("Invalid avatar ID") };
        };
    };

    public shared ({ caller = _caller }) func restoreHP(avatarId : Text, amount : Nat) : async Result.Result<(), Text> {
        switch (Nat.fromText(avatarId)) {
            case (?id) {
                switch (avatarHP.get(id)) {
                    case (?currentHP) {
                        let tokensRequired = amount;
                        let result = await spendTokens(avatarId, tokensRequired);
                        switch (result) {
                            case (#ok(_)) {
                                let newHP = Nat.min(MAX_HP, currentHP + amount);
                                avatarHP.put(id, newHP);
                                #ok(());
                            };
                            case (#err(e)) {
                                #err(e);
                            };
                        };
                    };
                    case null { return #err("Avatar HP not found") };
                };
            };
            case null { return #err("Invalid avatar ID") };
        };
    };

    // Token management functions
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

    public shared ({ caller = _caller }) func spendTokens(userId : Text, amount : Nat) : async Result.Result<(), Text> {
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

    // Achievement system
    public func unlockAchievement(userId : Text, achievementId : Text) : async Result.Result<(), Text> {
        switch (userAchievements.get(userId)) {
            case (?achievements) {
                if (Array.find(achievements, func(a : Text) : Bool { a == achievementId }) != null) {
                    #err("Achievement already unlocked");
                } else {
                    userAchievements.put(userId, Array.append(achievements, [achievementId]));
                    await updateSocialScore(userId);
                    #ok(());
                };
            };
            case (null) {
                userAchievements.put(userId, [achievementId]);
                await updateSocialScore(userId);
                #ok(());
            };
        };
    };

    private func updateSocialScore(userId : Text) : async () {
        switch (userAchievements.get(userId)) {
            case (?achievements) {
                let newScore = achievements.size() * 10; // Simple scoring: 10 points per achievement
                userSocialScores.put(userId, newScore);
            };
            case (null) {};
        };
    };

    // Query functions for frontend integration
    public query func getUserTokens(userId : Text) : async ?Nat {
        userTokens.get(userId);
    };

    public func getUserAvatars(userPrincipalId : Text) : async [Nat] {
        await wellnessAvatarNFT.icrc7_tokens_of({ owner = Principal.fromText(userPrincipalId); subaccount = null }, null, null);
    };

    public shared ({ caller }) func getUserAvatarsSelf() : async [(Nat, ?[(Text, ICRC7.Value)])] {
        let tokenIds = await wellnessAvatarNFT.icrc7_tokens_of({ owner = caller; subaccount = null }, null, null);
        let metadata = await wellnessAvatarNFT.icrc7_token_metadata(tokenIds);

        Array.tabulate<(Nat, ?[(Text, ICRC7.Value)])>(tokenIds.size(), func(i) { (tokenIds[i], metadata[i]) });
    };

    public query func getAvatarAttributes(tokenId : Nat) : async Result.Result<(AvatarAttributes, Nat), Text> {
        switch (avatarAttributes.get(tokenId), avatarHP.get(tokenId)) {
            case (?attributes, ?hp) { #ok((attributes, hp)) };
            case (_, _) { #err("Avatar not found") };
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

    public shared query ({ caller }) func whoami() : async Text {
        Principal.toText(caller);
    };

    public shared ({ caller }) func initiateVisit(professionalId : ?Text, facilityId : ?Text) : async Result.Result<Nat, Text> {
        await visitManager.initiateVisit(professionalId, facilityId);
    };

    public shared ({ caller }) func completeVisit(visitId : Nat, avatarId : Nat) : async Result.Result<(), Text> {
        let result = await visitManager.completeVisit(visitId);
        switch (result) {
            case (#ok(_)) {
                await updateAvatarAfterVisit(avatarId, Principal.toText(caller));
            };
            case (#err(e)) {
                return #err(e);
            };
        };
        #ok(());
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
        Int.abs(Float.toInt((Float.fromInt(BASE_TOKENS_PER_VISIT * qualityMultiplier) * hpFactor)));
    };

    public func getVisitCount(userId : Text) : async Nat {
        await visitManager.getVisitCount(userId);
    };
};
