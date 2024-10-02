import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Text "mo:base/Text";
import BTree "mo:stableheapbtreemap/BTree";

import Types "../Types";

actor class FacilityShard() {
    private var facilityMap : BTree.BTree<Text, Types.HealthIDFacility> = BTree.init<Text, Types.HealthIDFacility>(null);

    public shared func insertFacility(facilityID : Text, facility : Types.HealthIDFacility) : async Result.Result<(), Text> {
        if (BTree.has(facilityMap, Text.compare, facilityID)) {
            #err("Facility with ID " # facilityID # " already exists");
        } else {  
            let insertResult = BTree.insert(facilityMap, Text.compare, facilityID, facility);
            switch (insertResult) {
                case null {
                    if (BTree.has(facilityMap, Text.compare, facilityID)) {
                        #ok(());
                    } else {
                        #err("Failed to insert facility with ID " # facilityID);
                    };
                };
                case (?_) {
                    #err("Unexpected result: Facility already existed");
                };
            };
        };
    };

    public shared query func getFacility(facilityID : Text) : async Result.Result<Types.HealthIDFacility, Text> {
        switch (BTree.get(facilityMap, Text.compare, facilityID)) {
            case (?value) { #ok(value) };
            case null { #err("Facility not found") };
        };
    };

    public shared func updateFacility(facilityID : Text, facility : Types.HealthIDFacility) : async Result.Result<(), Text> {
        switch (BTree.get(facilityMap, Text.compare, facilityID)) {
            case (?_) {
                switch (BTree.insert(facilityMap, Text.compare, facilityID, facility)) {
                    case (?_) { #ok(()) };
                    case null { #err("Failed to update facility") };
                };
            };
            case null {
                #err("Facility not found");
            };
        };
    };

    public shared func deleteFacility(facilityID : Text) : async Result.Result<(), Text> {
        switch (BTree.delete(facilityMap, Text.compare, facilityID)) {
            case (?_) { #ok(()) };
            case null { #err("Facility not found") };
        };
    };

    public query func getFacilityCount() : async Nat {
        BTree.size(facilityMap);
    };

    public query func getAllFacilityIDs() : async [Text] {
        Array.map(BTree.toArray(facilityMap), func((id, _) : (Text, Types.HealthIDFacility)) : Text { id });
    };
};