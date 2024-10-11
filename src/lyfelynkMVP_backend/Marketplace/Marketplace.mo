import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";

import IdentityManager "../IdentityManager/IdentityManager";
import Types "../Types";
import MarketplaceShardManager "MarketplaceShardManager";

actor class Marketplace() {
    private let shardManager : MarketplaceShardManager.MarketplaceShardManager = actor (Types.marketplaceShardManagerCanisterID);
    private let identityManager : IdentityManager.IdentityManager = actor (Types.identityManagerCanisterID);

    public shared ({ caller }) func createListing(title : Text, description : Text, price : Nat, category : Text, assetID : Text) : async Result.Result<Text, Text> {
        let userIDResult = await getUserID(caller);
        switch (userIDResult) {
            case (#ok(userID)) {
                let listingIDResult = await shardManager.getNextListingID();
                switch (listingIDResult) {
                    case (#ok(listingID)) {
                        let timestamp = Int.toText(Time.now());
                        let listing : Types.Listing = {
                            id = listingID;
                            title = title;
                            description = description;
                            price = price;
                            category = category;
                            seller = userID;
                            timestamp = timestamp;
                            assetID = assetID;
                        };
                        let shardResult = await shardManager.getShard(listingID);
                        switch (shardResult) {
                            case (#ok(shard)) {
                                let result = await shard.addListing(listing);
                                switch (result) {
                                    case (#ok(_)) {
                                        let shardIDResult = await shardManager.getShardIDFromListingID(listingID);
                                        switch (shardIDResult) {
                                            case (#ok(shardID)) {
                                                ignore await shardManager.updateUserShardMap(userID, shardID);
                                            };
                                            case (#err(e)) { return #err(e) };
                                        };
                                        return (#ok(listingID)); // Wrap listingID in #ok and then in Result.Result
                                    };
                                    case (#err(e)) { #err(e) };
                                };
                            };
                            case (#err(e)) { #err(e) };
                        };
                    };
                    case (#err(e)) { #err("Error getting listing ID: " # e) };
                };
            };
            case (#err(e)) { #err("User not found: " # e) };
        };
    };

    public shared ({ caller }) func getListings() : async Result.Result<[Types.Listing], Text> {
        let allListings = Buffer.Buffer<Types.Listing>(0);
        let shardCountResult = await shardManager.getShardCount();
        switch (shardCountResult) {
            case (#ok(count)) {
                for (i in Iter.range(1, count)) {
                    let shardResult = await shardManager.getShard(Nat.toText(i));
                    switch (shardResult) {
                        case (#ok(shard)) {
                            let listingsResult = await shard.getListings();
                            switch (listingsResult) {
                                case (#ok(listings)) {
                                    allListings.append(Buffer.fromArray(listings));
                                };
                                case (#err(_)) {}; // Skip if error
                            };
                        };
                        case (#err(_)) {}; // Skip if error
                    };
                };
                #ok(Buffer.toArray(allListings));
            };
            case (#err(e)) { #err("Error getting shard count: " # e) };
        };
    };

    public shared ({ caller }) func purchaseListing(listingID : Text) : async Result.Result<Text, Text> {
        let userIDResult = await getUserID(caller);
        switch (userIDResult) {
            case (#ok(buyerID)) {
                let shardResult = await shardManager.getShard(listingID);
                switch (shardResult) {
                    case (#ok(shard)) {
                        let purchaseResult = await shard.purchaseListing(listingID, buyerID);
                        switch (purchaseResult) {
                            case (#ok(message)) { #ok(message) };
                            case (#err(e)) { #err(e) };
                        };
                    };
                    case (#err(e)) { #err(e) };
                };
            };
            case (#err(e)) { #err("User not found: " # e) };
        };
    };

    public shared ({ caller }) func updateListing(listingID : Text, updatedListing : Types.Listing) : async Result.Result<(), Text> {
        let userIDResult = await getUserID(caller);
        switch (userIDResult) {
            case (#ok(userID)) {
                if (userID != updatedListing.seller) {
                    return #err("You are not authorized to update this listing");
                };
                let shardResult = await shardManager.getShard(listingID);
                switch (shardResult) {
                    case (#ok(shard)) {
                        await shard.updateListing(updatedListing);
                    };
                    case (#err(e)) { #err(e) };
                };
            };
            case (#err(e)) { #err("User not found: " # e) };
        };
    };

    public shared ({ caller }) func deleteListing(listingID : Text) : async Result.Result<(), Text> {
        let userIDResult = await getUserID(caller);
        switch (userIDResult) {
            case (#ok(userID)) {
                let shardResult = await shardManager.getShard(listingID);
                switch (shardResult) {
                    case (#ok(shard)) {
                        await shard.deleteListing(listingID, userID);
                    };
                    case (#err(e)) { #err(e) };
                };
            };
            case (#err(e)) { #err("User not found: " # e) };
        };
    };

    public shared ({ caller }) func getUserListings() : async Result.Result<[Types.Listing], Text> {
        let userIDResult = await getUserID(caller);
        switch (userIDResult) {
            case (#ok(userID)) {
                let userShardsResult = await shardManager.getUserShards(userID);
                switch (userShardsResult) {
                    case (#ok(userShards)) {
                        let allListings = Buffer.Buffer<Types.Listing>(0);
                        for (shard in userShards.vals()) {
                            let listingsResult = await shard.getUserListings(userID);
                            switch (listingsResult) {
                                case (#ok(listings)) {
                                    allListings.append(Buffer.fromArray(listings));
                                };
                                case (#err(_)) {}; // Skip if error
                            };
                        };
                        #ok(Buffer.toArray(allListings));
                    };
                    case (#err(e)) { #err(e) };
                };
            };
            case (#err(e)) { #err("User not found: " # e) };
        };
    };

    private func getUserID(principal : Principal) : async Result.Result<Text, Text> {
        let identityResult = await identityManager.getIdentity(principal);
        switch (identityResult) {
            case (#ok((id, _))) { #ok(id) };
            case (#err(e)) { #err(e) };
        };
    };

    public shared ({ caller }) func updateMarketplaceShardWasmModule(wasmModule : [Nat8]) : async Result.Result<(), Text> {
        await shardManager.updateWasmModule(wasmModule);
    };
};
