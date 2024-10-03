// VisitManager.mo

import Hash "mo:base/Hash";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
actor class VisitManager() {
    type Visit = {
        userId : Text;
        professionalId : ?Text;
        facilityId : ?Text;
        status : VisitStatus;
        timestamp : Time.Time;
    };

    type VisitStatus = {
        #Pending;
        #Completed;
        #Cancelled;
    };

    private let visits = HashMap.HashMap<Nat, Visit>(0, Nat.equal, Hash.hash);
    private var nextVisitId : Nat = 1;

    public shared ({ caller }) func initiateVisit(professionalId : ?Text, facilityId : ?Text) : async Result.Result<Nat, Text> {
        let visitId = nextVisitId;
        nextVisitId += 1;

        let newVisit : Visit = {
            userId = Principal.toText(caller);
            professionalId = professionalId;
            facilityId = facilityId;
            status = #Pending;
            timestamp = Time.now();
        };

        visits.put(visitId, newVisit);
        #ok(visitId);
    };

    public shared ({ caller }) func completeVisit(visitId : Nat) : async Result.Result<(), Text> {
        switch (visits.get(visitId)) {
            case (?visit) {
                if (visit.professionalId == ?Principal.toText(caller) or visit.facilityId == ?Principal.toText(caller)) {
                    let updatedVisit : Visit = {
                        userId = visit.userId;
                        professionalId = visit.professionalId;
                        facilityId = visit.facilityId;
                        status = #Completed;
                        timestamp = visit.timestamp;
                    };
                    visits.put(visitId, updatedVisit);
                    #ok(());
                } else {
                    #err("Unauthorized to complete this visit");
                };
            };
            case (null) {
                #err("Visit not found");
            };
        };
    };

    public query func getVisitCount(userId : Text) : async Nat {
        var count = 0;
        for ((_, visit) in visits.entries()) {
            if (visit.userId == userId and visit.status == #Completed) {
                count += 1;
            };
        };
        count;
    };

    public query func getVisitStatus(visitId : Nat) : async Result.Result<VisitStatus, Text> {
        switch (visits.get(visitId)) {
            case (?visit) {
                #ok(visit.status);
            };
            case (null) {
                #err("Visit not found");
            };
        };
    };
};
