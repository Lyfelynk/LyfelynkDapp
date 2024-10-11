import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import BTree "mo:stableheapbtreemap/BTree";

import Types "../Types";

actor class MarketplaceShard() {
    private stable var listings : BTree.BTree<Text, Types.Listing> = BTree.init<Text, Types.Listing>(null);

    public shared ({ caller }) func addListing(listing : Types.Listing) : async Result.Result<(), Text> {
        ignore BTree.insert(listings, Text.compare, listing.id, listing);
        #ok(());
    };

    public shared query func getListing(listingID : Text) : async Result.Result<Types.Listing, Text> {
        switch (BTree.get(listings, Text.compare, listingID)) {
            case (?listing) { #ok(listing) };
            case null { #err("Listing not found") };
        };
    };

    public shared query func getListings() : async Result.Result<[Types.Listing], Text> {
        let listingsArray = Buffer.Buffer<Types.Listing>(0);
        for ((_, listing) in BTree.entries(listings)) {
            listingsArray.add(listing);
        };
        #ok(Buffer.toArray(listingsArray));
    };

    public shared ({ caller }) func updateListing(updatedListing : Types.Listing) : async Result.Result<(), Text> {
        switch (BTree.get(listings, Text.compare, updatedListing.id)) {
            case (?existingListing) {
                if (existingListing.seller != updatedListing.seller) {
                    return #err("You are not authorized to update this listing");
                };
                ignore BTree.insert(listings, Text.compare, updatedListing.id, updatedListing);
                #ok(());
            };
            case null {
                #err("Listing not found");
            };
        };
    };

    public shared ({ caller }) func deleteListing(listingID : Text, userID : Text) : async Result.Result<(), Text> {
        switch (BTree.get(listings, Text.compare, listingID)) {
            case (?listing) {
                if (listing.seller != userID) {
                    return #err("You are not authorized to delete this listing");
                };
                ignore BTree.delete(listings, Text.compare, listingID);
                #ok(());
            };
            case null {
                #err("Listing not found");
            };
        };
    };

    public shared ({ caller }) func purchaseListing(listingID : Text, buyerID : Text) : async Result.Result<Text, Text> {
        switch (BTree.get(listings, Text.compare, listingID)) {
            case (?listing) {
                if (listing.seller == buyerID) {
                    return #err("You cannot purchase your own listing");
                };

                // Step 1: Process payment
                let paymentResult = await processPayment(buyerID, listing.price);
                switch (paymentResult) {
                    case (#err(e)) {
                        return #err("Payment failed: " # e);
                    };
                    case (#ok(_)) {
                        // Step 2: Transfer ownership
                        let transferResult = await transferOwnership(listing.assetID, buyerID);
                        switch (transferResult) {
                            case (#err(e)) {
                                return #err("Ownership transfer failed: " # e);
                            };
                            case (#ok(_)) {
                                // Step 3: Remove listing from the shard
                                ignore BTree.delete(listings, Text.compare, listingID);
                                return #ok("Listing " # listingID # " purchased successfully by " # buyerID);
                            };
                        };
                    };
                };
            };
            case null {
                return #err("Listing not found");
            };
        };
    };

    public shared query func getUserListings(userID : Text) : async Result.Result<[Types.Listing], Text> {
        let userListings = Buffer.Buffer<Types.Listing>(0);
        for ((_, listing) in BTree.entries(listings)) {
            if (listing.seller == userID) {
                userListings.add(listing);
            };
        };
        #ok(Buffer.toArray(userListings));
    };

    // Dummy implementations for processPayment and transferOwnership
    private func processPayment(buyerPrincipal : Principal, amount : Nat, sellerPrincipal : Principal) : async Result.Result<(), Text> {

        let balanceBuyer = await tokenCanister_api.icrc1_balance_of({
            owner = buyerPrincipal;
            subaccount = null;
        });

        if (balanceBuyer < amount * 100000000 + 10000) {
            return #err("Not enough Funds");
        };

        let tokenTransferResult = await tokenCanister_api.icrc2_transfer_from({
            to = {
                owner = sellerPrincipal; // Assume sellerPrincipal is defined elsewhere
                subaccount = null;
            };
            from = {
                owner = buyerPrincipal;
                subaccount = null;
            };
            amount = amount * 100000000;
            fee = ?10000;
            memo = null;
            created_at_time = null;
            spender_subaccount = null;
        });

        switch (tokenTransferResult) {
            case (#Err(transfererror)) {
                return #err("Payment failed: " # debug_show (transfererror));
            };
            case (_) {
                #ok(());
            };
        };
    };

    private func transferOwnership(assetID : Text, newOwnerID : Text) : async Result.Result<(), Text> {
        let uniqueID = assetID; // Assuming assetID is already in the correct format
        let newOwnerPrincipal = Principal.fromText(newOwnerID);

        // Get the shard for the asset
        let shardResult = await ShardManager.getShard(assetID);
        switch (shardResult) {
            case (#ok(shard)) {
                // Update dataAccessPT map
                let updatePTResult = await shard.updateDataAccessPT(newOwnerPrincipal, uniqueID);
                switch (updatePTResult) {
                    case (#err(e)) {
                        return #err("Failed to update dataAccessPT: " # e);
                    };
                    case (#ok(_)) {};
                };

                // Update dataAccessTP map
                let updateTPResult = await shard.updateDataAccessTP(uniqueID, newOwnerPrincipal);
                switch (updateTPResult) {
                    case (#err(e)) {
                        return #err("Failed to update dataAccessTP: " # e);
                    };
                    case (#ok(_)) {};
                };

                #ok(());
            };
            case (#err(e)) {
                return #err("Failed to get shard: " # e);
            };
        };
    };

};
