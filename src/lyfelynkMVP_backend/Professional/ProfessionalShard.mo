import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Text "mo:base/Text";
import BTree "mo:stableheapbtreemap/BTree";

import Types "../Types";

actor class ProfessionalShard() {
    private var professionalMap : BTree.BTree<Text, Types.HealthIDProfessional> = BTree.init<Text, Types.HealthIDProfessional>(null);

    public shared func insertProfessional(professionalID : Text, professional : Types.HealthIDProfessional) : async Result.Result<(), Text> {
        if (BTree.has(professionalMap, Text.compare, professionalID)) {
            #err("Professional with ID " # professionalID # " already exists");
        } else {
            let insertResult = BTree.insert(professionalMap, Text.compare, professionalID, professional);
            switch (insertResult) {
                case null {
                    if (BTree.has(professionalMap, Text.compare, professionalID)) {
                        #ok(());
                    } else {
                        #err("Failed to insert professional with ID " # professionalID);
                    };
                };
                case (?_) {
                    #err("Unexpected result: Professional already existed");
                };
            };
        };
    };

    public shared query func getProfessional(professionalID : Text) : async Result.Result<Types.HealthIDProfessional, Text> {
        switch (BTree.get(professionalMap, Text.compare, professionalID)) {
            case (?value) { #ok(value) };
            case null { #err("Professional not found") };
        };
    };

    public shared func updateProfessional(professionalID : Text, professional : Types.HealthIDProfessional) : async Result.Result<(), Text> {
        switch (BTree.get(professionalMap, Text.compare, professionalID)) {
            case (?_) {
                switch (BTree.insert(professionalMap, Text.compare, professionalID, professional)) {
                    case (?_) { #ok(()) };
                    case null { #err("Failed to update professional") };
                };
            };
            case null {
                #err("Professional not found");
            };
        };
    };

    public shared func deleteProfessional(professionalID : Text) : async Result.Result<(), Text> {
        switch (BTree.delete(professionalMap, Text.compare, professionalID)) {
            case (?_) { #ok(()) };
            case null { #err("Professional not found") };
        };
    };

    public query func getProfessionalCount() : async Nat {
        BTree.size(professionalMap);
    };

    public query func getAllProfessionalIDs() : async [Text] {
        Array.map(BTree.toArray(professionalMap), func((id, _) : (Text, Types.HealthIDProfessional)) : Text { id });
    };
};
