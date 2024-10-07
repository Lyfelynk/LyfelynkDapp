// VisitManager.mo

import Array "mo:base/Array";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
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
        duration : Nat; // Duration in minutes
        avatarId : Nat;
    };

    type VisitStatus = {
        #Pending;
        #Approved;
        #Completed;
        #Cancelled;
        #Rejected;
    };

    type ProfessionalInfo = {
        id : Text;
        name : Text;
        specialization : Text;
        availableSlots : [(Time.Time, Time.Time)]; // (start, end) times
    };

    type FacilityInfo = {
        id : Text;
        name : Text;
        facilityType : Text;
        availableSlots : [(Time.Time, Time.Time)]; // (start, end) times
    };

    private stable var visitsEntries : [(Nat, Visit)] = [];
    private var visits : TrieMap.TrieMap<Nat, Visit> = TrieMap.fromEntries(visitsEntries.vals(), Nat.equal, Hash.hash);

    private stable var userVisitsEntries : [(Text, [Nat])] = [];
    private var userVisits : TrieMap.TrieMap<Text, [Nat]> = TrieMap.fromEntries(userVisitsEntries.vals(), Text.equal, Text.hash);

    private stable var professionalVisitsEntries : [(Text, [Nat])] = [];
    private var professionalVisits : TrieMap.TrieMap<Text, [Nat]> = TrieMap.fromEntries(professionalVisitsEntries.vals(), Text.equal, Text.hash);

    private stable var facilityVisitsEntries : [(Text, [Nat])] = [];
    private var facilityVisits : TrieMap.TrieMap<Text, [Nat]> = TrieMap.fromEntries(facilityVisitsEntries.vals(), Text.equal, Text.hash);

    private stable var professionalsEntries : [(Text, ProfessionalInfo)] = [];
    private var professionals : TrieMap.TrieMap<Text, ProfessionalInfo> = TrieMap.fromEntries(professionalsEntries.vals(), Text.equal, Text.hash);

    private stable var facilitiesEntries : [(Text, FacilityInfo)] = [];
    private var facilities : TrieMap.TrieMap<Text, FacilityInfo> = TrieMap.fromEntries(facilitiesEntries.vals(), Text.equal, Text.hash);

    private stable var avatarVisitCountEntries : [(Nat, Nat)] = [];
    private var avatarVisitCount : TrieMap.TrieMap<Nat, Nat> = TrieMap.fromEntries(avatarVisitCountEntries.vals(), Nat.equal, Hash.hash);

    private stable var nextVisitId : Nat = 1;

    private let identityManager : IdentityManager.IdentityManager = actor (Types.identityManagerCanisterID);

    system func preupgrade() {
        visitsEntries := Iter.toArray(visits.entries());
        userVisitsEntries := Iter.toArray(userVisits.entries());
        professionalVisitsEntries := Iter.toArray(professionalVisits.entries());
        facilityVisitsEntries := Iter.toArray(facilityVisits.entries());
        professionalsEntries := Iter.toArray(professionals.entries());
        facilitiesEntries := Iter.toArray(facilities.entries());
        avatarVisitCountEntries := Iter.toArray(avatarVisitCount.entries());
    };

    system func postupgrade() {
        visits := TrieMap.fromEntries(visitsEntries.vals(), Nat.equal, Hash.hash);
        userVisits := TrieMap.fromEntries(userVisitsEntries.vals(), Text.equal, Text.hash);
        professionalVisits := TrieMap.fromEntries(professionalVisitsEntries.vals(), Text.equal, Text.hash);
        facilityVisits := TrieMap.fromEntries(facilityVisitsEntries.vals(), Text.equal, Text.hash);
        professionals := TrieMap.fromEntries(professionalsEntries.vals(), Text.equal, Text.hash);
        facilities := TrieMap.fromEntries(facilitiesEntries.vals(), Text.equal, Text.hash);
        avatarVisitCount := TrieMap.fromEntries(avatarVisitCountEntries.vals(), Nat.equal, Hash.hash);
    };

    // Function to add or update professional information
    public shared ({ caller }) func updateProfessionalInfo(name : Text, specialization : Text, availableSlots : [(Time.Time, Time.Time)]) : async Result.Result<(), Text> {
        let verificationResult = await identityManager.checkRegistrationByPrincipal(caller);
        switch (verificationResult) {
            case (#ok(userType)) {
                if (userType == "Professional") {
                    let idResult = await identityManager.getIdentity(caller);
                    switch (idResult) {
                        case (#ok((id, _))) {
                            let profInfo : ProfessionalInfo = {
                                id = id;
                                name = name;
                                specialization = specialization;
                                availableSlots = availableSlots;
                            };
                            professionals.put(id, profInfo);
                            #ok(());
                        };
                        case (#err(e)) { #err(e) };
                    };
                } else {
                    #err("Caller is not registered as a Professional");
                };
            };
            case (#err(e)) { #err(e) };
        };
    };

    // Function to add or update facility information
    public shared ({ caller }) func updateFacilityInfo(name : Text, facilityType : Text, availableSlots : [(Time.Time, Time.Time)]) : async Result.Result<(), Text> {
        let verificationResult = await identityManager.checkRegistrationByPrincipal(caller);
        switch (verificationResult) {
            case (#ok(userType)) {
                if (userType == "Facility") {
                    let idResult = await identityManager.getIdentity(caller);
                    switch (idResult) {
                        case (#ok((id, _))) {
                            let facInfo : FacilityInfo = {
                                id = id;
                                name = name;
                                facilityType = facilityType;
                                availableSlots = availableSlots;
                            };
                            facilities.put(id, facInfo);
                            #ok(());
                        };
                        case (#err(e)) { #err(e) };
                    };
                } else {
                    #err("Caller is not registered as a Facility");
                };
            };
            case (#err(e)) { #err(e) };
        };
    };

    // Function to get all available professionals
    public query func getAllProfessionals() : async [ProfessionalInfo] {
        Iter.toArray(professionals.vals());
    };

    // Function to get all available facilities
    public query func getAllFacilities() : async [FacilityInfo] {
        Iter.toArray(facilities.vals());
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

    private func hasOverlappingVisit(id : Text, timestamp : Time.Time, duration : Nat) : Bool {
        let endTime = timestamp + duration * 60_000_000_000; // Convert minutes to nanoseconds
        for ((_, visit) in visits.entries()) {
            if (visit.professionalId == ?id or visit.facilityId == ?id) {
                let visitEndTime = visit.timestamp + visit.duration * 60_000_000_000;
                if (
                    (timestamp >= visit.timestamp and timestamp < visitEndTime) or
                    (endTime > visit.timestamp and endTime <= visitEndTime)
                ) {
                    return true;
                };
            };
        };
        false;
    };

    public func initiateVisit(caller : Principal, idToVisit : Text, timestamp : Time.Time, duration : Nat, avatarId : Nat) : async Result.Result<Nat, Text> {
        let userIdResult = await getUserId(caller);
        switch (userIdResult) {
            case (#ok(userId)) {
                let isProfessional = professionals.get(idToVisit);
                let isFacility = facilities.get(idToVisit);

                switch (isProfessional, isFacility) {
                    case (?profInfo, null) {
                        if (hasOverlappingVisit(idToVisit, timestamp, duration)) {
                            return #err("The selected time slot is not available");
                        };

                        let visitId = nextVisitId;
                        nextVisitId += 1;

                        let newVisit : Visit = {
                            visitId = visitId;
                            userId = userId;
                            professionalId = ?idToVisit;
                            facilityId = null;
                            status = #Pending;
                            timestamp = timestamp;
                            duration = duration;
                            avatarId = avatarId;
                        };

                        visits.put(visitId, newVisit);
                        addVisitToMap(userVisits, userId, visitId);
                        addVisitToMap(professionalVisits, idToVisit, visitId);

                        #ok(visitId);
                    };
                    case (null, ?facInfo) {
                        if (hasOverlappingVisit(idToVisit, timestamp, duration)) {
                            return #err("The selected time slot is not available");
                        };

                        let visitId = nextVisitId;
                        nextVisitId += 1;

                        let newVisit : Visit = {
                            visitId = visitId;
                            userId = userId;
                            professionalId = null;
                            facilityId = ?idToVisit;
                            status = #Pending;
                            timestamp = timestamp;
                            duration = duration;
                            avatarId = avatarId;
                        };

                        visits.put(visitId, newVisit);
                        addVisitToMap(userVisits, userId, visitId);
                        addVisitToMap(facilityVisits, idToVisit, visitId);

                        #ok(visitId);
                    };
                    case (null, null) {
                        #err("Invalid professional or facility ID");
                    };
                    case (?_, ?_) {
                        #err("ID conflict: found in both professional and facility lists");
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
                                    duration = visit.duration;
                                    timestamp = visit.timestamp;
                                    avatarId = visit.avatarId;
                                };
                                visits.put(visitId, updatedVisit);

                                if (newStatus == #Completed) {
                                    let currentCount = switch (avatarVisitCount.get(visit.avatarId)) {
                                        case (?count) count;
                                        case null 0;
                                    };
                                    avatarVisitCount.put(visit.avatarId, currentCount + 1);
                                };

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

    private func getUserId(principal : Principal) : async Result.Result<Text, Text> {
        let result = await identityManager.getIdentity(principal);
        switch (result) {
            case (#ok((id, _))) { #ok(id) };
            case (#err(e)) { #err(e) };
        };
    };

    // Function to get information for a specific professional
    public query func getProfessionalInfo(professionalId : Text) : async Result.Result<ProfessionalInfo, Text> {
        switch (professionals.get(professionalId)) {
            case (?profInfo) { #ok(profInfo) };
            case null { #err("Professional not found") };
        };
    };

    public shared ({ caller }) func getProfessionalInfoSelf() : async Result.Result<ProfessionalInfo, Text> {
        let idResult = await identityManager.getIdentity(caller);
        switch (idResult) {
            case (#ok((id, _))) {
                switch (professionals.get(id)) {
                    case (?profInfo) { #ok(profInfo) };
                    case null { #err("Professional not found") };
                };
            };
            case (#err(e)) { #err(e) };
        };
    };

    // Function to get information for a specific facility
    public query func getFacilityInfo(facilityId : Text) : async Result.Result<FacilityInfo, Text> {
        switch (facilities.get(facilityId)) {
            case (?facInfo) { #ok(facInfo) };
            case null { #err("Facility not found") };
        };
    };

    public shared ({ caller }) func getFacilityInfoSelf() : async Result.Result<FacilityInfo, Text> {
        let idResult = await identityManager.getIdentity(caller);
        switch (idResult) {
            case (#ok((id, _))) {
                switch (facilities.get(id)) {
                    case (?facInfo) { #ok(facInfo) };
                    case null { #err("Facility not found") };
                };
            };
            case (#err(e)) { #err(e) };
        };
    };

    // Function to get all visits for a specific user
    public shared ({ caller }) func getUserVisits() : async Result.Result<[Visit], Text> {
        let userIdResult = await getUserId(caller);
        switch (userIdResult) {
            case (#ok(userId)) {
                switch (userVisits.get(userId)) {
                    case (?visitIds) {
                        let userVisitsList = Array.mapFilter<Nat, Visit>(
                            visitIds,
                            func(id) {
                                switch (visits.get(id)) {
                                    case (?visit) { ?visit };
                                    case null { null };
                                };
                            },
                        );
                        #ok(userVisitsList);
                    };
                    case null { #ok([]) };
                };
            };
            case (#err(e)) { #err(e) };
        };
    };

    // Function to update available slots for professionals
    public shared ({ caller }) func updateProfessionalSlots(availableSlots : [(Time.Time, Time.Time)]) : async Result.Result<(), Text> {
        let verificationResult = await identityManager.checkRegistrationByPrincipal(caller);
        switch (verificationResult) {
            case (#ok(userType)) {
                if (userType == "Professional") {
                    let idResult = await identityManager.getIdentity(caller);
                    switch (idResult) {
                        case (#ok((id, _))) {
                            switch (professionals.get(id)) {
                                case (?profInfo) {
                                    let updatedProfInfo : ProfessionalInfo = {
                                        id = profInfo.id;
                                        name = profInfo.name;
                                        specialization = profInfo.specialization;
                                        availableSlots = availableSlots;
                                    };
                                    professionals.put(id, updatedProfInfo);
                                    #ok(());
                                };
                                case null { #err("Professional not found") };
                            };
                        };
                        case (#err(e)) { #err(e) };
                    };
                } else {
                    #err("Caller is not registered as a Professional");
                };
            };
            case (#err(e)) { #err(e) };
        };
    };

    // Function to update available slots for facilities
    public shared ({ caller }) func updateFacilitySlots(availableSlots : [(Time.Time, Time.Time)]) : async Result.Result<(), Text> {
        let verificationResult = await identityManager.checkRegistrationByPrincipal(caller);
        switch (verificationResult) {
            case (#ok(userType)) {
                if (userType == "Facility") {
                    let idResult = await identityManager.getIdentity(caller);
                    switch (idResult) {
                        case (#ok((id, _))) {
                            switch (facilities.get(id)) {
                                case (?facInfo) {
                                    let updatedFacInfo : FacilityInfo = {
                                        id = facInfo.id;
                                        name = facInfo.name;
                                        facilityType = facInfo.facilityType;
                                        availableSlots = availableSlots;
                                    };
                                    facilities.put(id, updatedFacInfo);
                                    #ok(());
                                };
                                case null { #err("Facility not found") };
                            };
                        };
                        case (#err(e)) { #err(e) };
                    };
                } else {
                    #err("Caller is not registered as a Facility");
                };
            };
            case (#err(e)) { #err(e) };
        };
    };

    // Function to get available slots for a specific professional or facility
    public query func getAvailableSlots(idToVisit : Text) : async Result.Result<[(Time.Time, Time.Time)], Text> {
        let isProfessional = professionals.get(idToVisit);
        let isFacility = facilities.get(idToVisit);

        switch (isProfessional, isFacility) {
            case (?profInfo, null) {
                #ok(profInfo.availableSlots);
            };
            case (null, ?facInfo) {
                #ok(facInfo.availableSlots);
            };
            case (null, null) {
                #err("Invalid professional or facility ID");
            };
            case (?_, ?_) {
                #err("ID conflict: found in both professional and facility lists");
            };
        };
    };

    // Function to get visit count for an avatar
    public query func getAvatarVisitCount(avatarId : Nat) : async Nat {
        switch (avatarVisitCount.get(avatarId)) {
            case (?count) count;
            case null 0;
        };
    };

    // Function to get visit counts for multiple avatars
    public query func getAvatarVisitCounts(avatarIds : [Nat]) : async [(Nat, Nat)] {
        Array.map<Nat, (Nat, Nat)>(
            avatarIds,
            func(avatarId) {
                let count = switch (avatarVisitCount.get(avatarId)) {
                    case (?c) c;
                    case null 0;
                };
                (avatarId, count);
            },
        );
    };
};
