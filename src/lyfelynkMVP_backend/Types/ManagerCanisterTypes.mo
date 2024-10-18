import DataAssetShardManager "../DataAsset/DataAssetShardManager";
import FacilityShardManager "../Facility/FacilityShardManager";
import ProfessionalShardManager "../Professional/ProfessionalShardManager";
import SharedActivityShardManager "../SharedActivitySystem/SharedActivityShardManager";
import UserShardManager "../User/UserShardManager";
import CanisterIDs "CanisterIDs";
module ManagerCanisterTypes {
    public let dataAssetShardManager : DataAssetShardManager.DataAssetShardManager = actor (CanisterIDs.dataAssetShardManagerCanisterID);
    public let facilityShardManager : FacilityShardManager.FacilityShardManager = actor (CanisterIDs.facilityShardManagerCanisterID);
    public let professionalShardManager : ProfessionalShardManager.ProfessionalShardManager = actor (CanisterIDs.professionalShardManagerCanisterID);
    public let sharedActivityShardManager : SharedActivityShardManager.SharedActivityShardManager = actor (CanisterIDs.sharedActivityShardManagerCanisterID);
    public let userShardManager : UserShardManager.UserShardManager = actor (CanisterIDs.userShardManagerCanisterID);
};
