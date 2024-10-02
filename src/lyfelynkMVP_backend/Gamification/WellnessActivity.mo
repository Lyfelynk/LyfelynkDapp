import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
actor class WellnessActivity() {
    let visits = HashMap.HashMap<Text, (Text, Time.Time)>(0, Text.equal, Text.hash);

    public shared ({ caller }) func initiateVisit(professionalId : Text) : async Result.Result<Text, Text> {
        let visitId = Principal.toText(caller) # "_" # Int.toText(Time.now());
        visits.put(visitId, (professionalId, Time.now()));
        #ok(visitId);
    };

    public shared ({ caller }) func completeVisit(visitId : Text) : async Result.Result<(), Text> {
        switch (visits.get(visitId)) {
            case (?visit) {
                visits.delete(visitId);
                #ok(());
            };
            case (null) {
                #err("Visit not found");
            };
        };
    };

    public func verifyPresence(qrCode : Text) : async Bool {
        // In a real implementation, you would validate the QR code
        // For this example, we'll just check if it exists in our visits
        switch (visits.get(qrCode)) {
            case (?visit) {
                let (_, visitTime) = visit;
                // Check if the visit is within the last hour
                Time.now() - visitTime < 3600_000_000_000;
            };
            case (null) {
                false;
            };
        };
    };
};
