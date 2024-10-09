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

    public let admin : Text = ("2n52h-xa3zc-ijie2-xgdcm-jxi6p-oapl2-ahgsh-sbbde-q2nh2-rvrgh-4qe");
    public let vetkdSystemCanisterID : Text = ("dfdal-2uaaa-aaaaa-qaama-cai");
    public let wellnessAvatarNFTCanisterID : Text = ("cuj6u-c4aaa-aaaaa-qaajq-cai");
    public let identityManagerCanisterID : Text = ("avqkn-guaaa-aaaaa-qaaea-cai");
    public let userServiceCanisterID : Text = ("aax3a-h4aaa-aaaaa-qaahq-cai");
    public let professionalServiceCanisterID : Text = ("asrmz-lmaaa-aaaaa-qaaeq-cai");
    public let facilityServiceCanisterID : Text = ("br5f7-7uaaa-aaaaa-qaaca-cai");
    public let dataAssetCanisterID : Text = ("bkyz2-fmaaa-aaaaa-qaaaq-cai");
    public let sharedActivityCanisterID : Text = ("ahw5u-keaaa-aaaaa-qaaha-cai");
    public let userShardManagerCanisterID : Text = ("c2lt4-zmaaa-aaaaa-qaaiq-cai");
    public let professionalShardManagerCanisterID : Text = ("a4tbr-q4aaa-aaaaa-qaafq-cai");
    public let facilityShardManagerCanisterID : Text = ("b77ix-eeaaa-aaaaa-qaada-cai");
    public let dataAssetShardManagerCanisterID : Text = ("be2us-64aaa-aaaaa-qaabq-cai");
    public let sharedActivityShardManagerCanisterID : Text = ("aovwi-4maaa-aaaaa-qaagq-cai");
    public let xpSystemCanisterID : Text = ("cbopz-duaaa-aaaaa-qaaka-cai");
    public let gamificationSystemCanisterID : Text = ("by6od-j4aaa-aaaaa-qaadq-cai");
    public let visitManagerCanisterID : Text = ("ctiya-peaaa-aaaaa-qaaja-cai");

    public let permissionedCanisters : [Text] = [
        admin,
        vetkdSystemCanisterID,
        wellnessAvatarNFTCanisterID,
        identityManagerCanisterID,
        userServiceCanisterID,
        professionalServiceCanisterID,
        facilityServiceCanisterID,
        dataAssetCanisterID,
        sharedActivityCanisterID,
        userShardManagerCanisterID,
        professionalShardManagerCanisterID,
        facilityShardManagerCanisterID,
        dataAssetShardManagerCanisterID,
        sharedActivityShardManagerCanisterID,
        xpSystemCanisterID,
        gamificationSystemCanisterID,
        visitManagerCanisterID,
    ];
};
