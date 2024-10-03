// VisitManager.mo

import Array "mo:base/Array";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import TrieMap "mo:base/TrieMap";

import IdentityManager "../IdentityManager/IdentityManager";
import Types "../Types";

actor class VisitManager() {
    type Visit = {
        visitId : Nat;
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
        #Rejected;
    };

    private let visits = TrieMap.TrieMap<Nat, Visit>(Nat.equal, Hash.hash);
    private let userVisits = TrieMap.TrieMap<Text, [Nat]>(Text.equal, Text.hash);
    private let professionalVisits = TrieMap.TrieMap<Text, [Nat]>(Text.equal, Text.hash);
    private let facilityVisits = TrieMap.TrieMap<Text, [Nat]>(Text.equal, Text.hash);
    private var nextVisitId : Nat = 1;
    private let identityManager : IdentityManager.IdentityManager = actor (Types.identityManagerCanisterID);

    private func getUserId(caller : Principal) : async Result.Result<Text, Text> {
        let identityResult = await identityManager.getIdentity(caller);
        switch (identityResult) {
            case (#ok((id, userType))) {
                if (userType == "User") {
                    #ok(id);
                } else {
                    #err("Caller is not a registered user");
                };
            };
            case (#err(e)) {
                #err(e);
            };
        };
    };

    private func addVisitToMap(map : TrieMap.TrieMap<Text, [Nat]>, key : Text, visitId : Nat) {
        switch (map.get(key)) {
            case (?existingVisits) {
                map.put(key, Array.append(existingVisits, [visitId]));
            };
            case null {
                map.put(key, [visitId]);
            };
        };
    };

    public func initiateVisit(caller : Principal, idToVisit : Text) : async Result.Result<Nat, Text> {
        let userIdResult = await getUserId(caller);
        switch (userIdResult) {
            case (#ok(userId)) {
                // Verify if the idToVisit is a valid professional or facility
                let verificationResult = await identityManager.checkRegistrationByPrincipal(
                    switch (await identityManager.getPrincipalByID(idToVisit)) {
                        case (#ok(principal)) principal;
                        case (#err(error)) return #err("Invalid ID: " # error);
                    }
                );
                switch (verificationResult) {
                    case (#ok(userType)) {
                        if (userType == "Professional" or userType == "Facility") {
                            let visitId = nextVisitId;
                            nextVisitId += 1;

                            let newVisit : Visit = {
                                visitId = visitId;
                                userId = userId;
                                professionalId = if (userType == "Professional") ?idToVisit else null;
                                facilityId = if (userType == "Facility") ?idToVisit else null;
                                status = #Pending;
                                timestamp = Time.now();
                            };

                            visits.put(visitId, newVisit);
                            addVisitToMap(userVisits, userId, visitId);

                            if (userType == "Professional") {
                                addVisitToMap(professionalVisits, idToVisit, visitId);
                            } else if (userType == "Facility") {
                                addVisitToMap(facilityVisits, idToVisit, visitId);
                            };

                            #ok(visitId);
                        } else {
                            #err("Invalid professional or facility ID");
                        };
                    };
                    case (#err(e)) {
                        #err("Error verifying professional or facility ID: " # e);
                    };
                };
            };
            case (#err(e)) {
                #err(e);
            };
        };
    };

    public shared ({ caller }) func getPendingVisits() : async Result.Result<[Visit], Text> {
        let callerIdResult = await identityManager.getIdentity(caller);
        switch (callerIdResult) {
            case (#ok((callerId, callerType))) {
                if (callerType == "Professional" or callerType == "Facility") {
                    let visitsMap = if (callerType == "Professional") professionalVisits else facilityVisits;
                    switch (visitsMap.get(callerId)) {
                        case (?visitIds) {
                            let pendingVisits = Array.mapFilter<Nat, Visit>(
                                visitIds,
                                func(id) {
                                    switch (visits.get(id)) {
                                        case (?visit) {
                                            if (visit.status == #Pending) {
                                                ?visit;
                                            } else {
                                                null;
                                            };
                                        };
                                        case null { null };
                                    };
                                },
                            );
                            #ok(pendingVisits);
                        };
                        case null { #ok([]) };
                    };
                } else {
                    #err("Caller is not a professional or facility");
                };
            };
            case (#err(e)) {
                #err("Error verifying caller identity: " # e);
            };
        };
    };

    public func updateVisitStatus(caller : Principal, visitId : Nat, newStatus : VisitStatus) : async Result.Result<(), Text> {
        switch (visits.get(visitId)) {
            case (?visit) {
                let callerIdResult = await identityManager.getIdentity(caller);
                switch (callerIdResult) {
                    case (#ok((callerId, callerType))) {
                        if (
                            (callerType == "Professional" and visit.professionalId == ?callerId) or
                            (callerType == "Facility" and visit.facilityId == ?callerId)
                        ) {
                            if (visit.status == #Pending) {
                                let updatedVisit : Visit = {
                                    visitId = visit.visitId;
                                    userId = visit.userId;
                                    professionalId = visit.professionalId;
                                    facilityId = visit.facilityId;
                                    status = newStatus;
                                    timestamp = visit.timestamp;
                                };
                                visits.put(visitId, updatedVisit);
                                #ok(());
                            } else {
                                #err("Can only update pending visits");
                            };
                        } else {
                            #err("Unauthorized to update this visit");
                        };
                    };
                    case (#err(e)) {
                        #err("Error verifying caller identity: " # e);
                    };
                };
            };
            case null {
                #err("Visit not found");
            };
        };
    };

    public query func getVisitCount(userId : Text) : async Nat {
        switch (userVisits.get(userId)) {
            case (?visitIds) {
                Array.foldLeft<Nat, Nat>(
                    visitIds,
                    0,
                    func(count, id) {
                        switch (visits.get(id)) {
                            case (?visit) {
                                if (visit.status == #Completed) {
                                    count + 1;
                                } else {
                                    count;
                                };
                            };
                            case null { count };
                        };
                    },
                );
            };
            case null { 0 };
        };
    };

    public query func getVisitStatus(visitId : Nat) : async Result.Result<VisitStatus, Text> {
        switch (visits.get(visitId)) {
            case (?visit) {
                #ok(visit.status);
            };
            case null {
                #err("Visit not found");
            };
        };
    };
};
