import Principal "mo:base/Principal";
import ICRC7 "mo:icrc7-mo";

import Types "../../Types";
module {
  public let defaultConfig = func(caller : Principal) : ICRC7.InitArgs {
    ?{
      symbol = ?"LYF";
      name = ?"LYFLYNK";
      description = ?"A Collection of Avatars to improve your wellness";
      logo = ?"https://gateway.lighthouse.storage/ipfs/bafkreihhnhf2wasvj7r3gywekm3lpgbiulpov6xwhcv2var2am4c3fn6wm";
      supply_cap = ?10000;
      allow_transfers = null;
      max_query_batch_size = ?100;
      max_update_batch_size = ?100;
      default_take_value = ?1000;
      max_take_value = ?10000;
      max_memo_size = ?512;
      permitted_drift = null;
      tx_window = null;
      burn_account = null; //burned nfts are deleted
      deployer = Principal.fromText(Types.admin);
      supported_standards = ?[
        {
          name = "ICRC-3";
          url = "https://github.com/PanIndustrial-Org/icrc3.mo";
        },
        {
          name = "ICRC-7";
          url = "https://github.com/PanIndustrial-Org/icrc7.mo";
        },
        {
          name = "ICRC-37";
          url = "https://github.com/PanIndustrial-Org/icrc37.mo";
        },
      ];
    };
  };
};
