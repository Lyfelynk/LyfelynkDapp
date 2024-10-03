import Blob "mo:base/Blob";
import Nat "mo:base/Nat";
import Text "mo:base/Text";

module Types {

    public type SharedType = {
        #Sold;
        #Shared;
    };

    public type Metadata = {
        category : Text;
        tags : [Text];
        format : Text; //  e.g., "CSV", "JSON", "image/png"
    };

    public type HealthIDUserData = {
        DemographicInformation : Blob;
        BasicHealthParameters : Blob;
        BiometricData : ?Blob;
        FamilyInformation : ?Blob;
    };
    public type HealthIDUser = {
        IDNum : Text;
        UUID : Text;
        MetaData : HealthIDUserData;
    };

    public type HealthIDProfessionalData = {
        DemographicInformation : Blob;
        OccupationInformation : Blob;
        CertificationInformation : Blob;
    };
    public type HealthIDProfessional = {
        IDNum : Text;
        UUID : Text;
        MetaData : HealthIDProfessionalData;
    };

    public type HealthIDFacilityData = {
        DemographicInformation : Blob;
        ServicesOfferedInformation : Blob;
        LicenseInformation : Blob;
    };
    public type HealthIDFacility = {
        IDNum : Text;
        UUID : Text;
        MetaData : HealthIDFacilityData;
    };

    public type DataAsset = {
        assetID : Text;
        title : Text;
        description : Text;
        data : Text;
        metadata : Metadata;
    };

    public type DataAssetInfo = {
        title : Text;
        description : Text;
        metadata : Metadata;
    };

    public type sharedActivityInfo = {
        activityID : Text;
        assetID : Text;
        usedSharedTo : Text;
        time : Nat;
        sharedType : SharedType;
    };

    public type Listing = {
        title : Text;
        description : Text;
        price : Nat;
        category : Text;
        seller : Text;
        assetID : Text;
    };

    public type purchasedInfo = {
        title : Text;
        listingID : Text;
        price : Nat;
        assetID : Text;
        time : Nat;
        seller : Text;
    };

    public type TokenRequestAmounts = {
        currentRequestAmount : Nat;
        approvedTillNow : Nat;
    };

    public type VETKD_SYSTEM_API = actor {
        vetkd_public_key : ({
            canister_id : ?Principal;
            derivation_path : [Blob];
            key_id : { curve : { #bls12_381 }; name : Text };
        }) -> async ({ public_key : Blob });

        vetkd_encrypted_key : ({
            derivation_id : Blob;
            public_key_derivation_path : [Blob];

            key_id : { curve : { #bls12_381 }; name : Text };
            encryption_public_key : Blob;
        }) -> async ({ encrypted_key : Blob });
    };

    public let admin : Text = ("eblrh-umgcj-fl75h-m36cu-lwppj-db6ll-x6emt-apn5e-gri6o-24ou3-pqe");
    public let vetkdSystemCanisterID : Text = ("dmalx-m4aaa-aaaaa-qaanq-cai");
    public let identityManagerCanisterID : Text = ("a3shf-5eaaa-aaaaa-qaafa-cai");
    public let wellnessAvatarNFTCanisterID : Text = ("cpmcr-yeaaa-aaaaa-qaala-cai");
    public let userServiceCanisterID : Text = ("ctiya-peaaa-aaaaa-qaaja-cai");
    public let professionalServiceCanisterID : Text = ("a4tbr-q4aaa-aaaaa-qaafq-cai");
    public let facilityServiceCanisterID : Text = ("bw4dl-smaaa-aaaaa-qaacq-cai");
    public let dataAssetCanisterID : Text = ("bd3sg-teaaa-aaaaa-qaaba-cai");
    public let sharedActivityCanisterID : Text = ("c5kvi-uuaaa-aaaaa-qaaia-cai");
    public let userShardManagerCanisterID : Text = ("cbopz-duaaa-aaaaa-qaaka-cai");
    public let professionalShardManagerCanisterID : Text = ("aovwi-4maaa-aaaaa-qaagq-cai");
    public let facilityShardManagerCanisterID : Text = ("by6od-j4aaa-aaaaa-qaadq-cai");
    public let dataAssetShardManagerCanisterID : Text = ("br5f7-7uaaa-aaaaa-qaaca-cai");
    public let sharedActivityShardManagerCanisterID : Text = ("aax3a-h4aaa-aaaaa-qaahq-cai");
    public let xpSystemCanisterID : Text = ("cinef-v4aaa-aaaaa-qaalq-cai");
    public let gamificationSystemCanisterID : Text = ("avqkn-guaaa-aaaaa-qaaea-cai");
};
