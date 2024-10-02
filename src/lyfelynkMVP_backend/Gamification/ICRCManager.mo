import Principal "mo:base/Principal";
import CertTree "mo:cert/CertTree";
import ICRC3 "mo:icrc3-mo";
import ICRC37 "mo:icrc37-mo";
import ICRC7 "mo:icrc7-mo";

import ICRC3Default "./initial_state/icrc3";
import ICRC37Default "./initial_state/icrc37";
import ICRC7Default "./initial_state/icrc7";

module {

    public type Account = ICRC7.Account;
    public type Environment = ICRC7.Environment;
    public type Value = ICRC7.Value;
    public type NFT = ICRC7.NFT;
    public type NFTShared = ICRC7.NFTShared;
    public type NFTMap = ICRC7.NFTMap;
    public type OwnerOfResponse = ICRC7.Service.OwnerOfResponse;
    public type OwnerOfRequest = ICRC7.Service.OwnerOfRequest;
    public type TransferArgs = ICRC7.Service.TransferArg;
    public type TransferResult = ICRC7.Service.TransferResult;
    public type TransferError = ICRC7.Service.TransferError;
    public type BalanceOfRequest = ICRC7.Service.BalanceOfRequest;
    public type BalanceOfResponse = ICRC7.Service.BalanceOfResponse;

    public type ICRCState = {
        icrc3_migration_state : ICRC3.State;
        icrc7_migration_state : ICRC7.State;
        icrc37_migration_state : ICRC37.State;
        icrc3_state_current : ICRC3.CurrentState;
        icrc7_state_current : ICRC7.CurrentState;
        icrc37_state_current : ICRC37.CurrentState;
    };

    public type ICRCInstances = {
        icrc3 : ICRC3.ICRC3;
        icrc7 : ICRC7.ICRC7;
        icrc37 : ICRC37.ICRC37;
    };

    public type ICRCEnvironment = {
        canister : () -> Principal;
        get_time : () -> Int;
        cert_store : CertTree.Store;
    };

    public func initICRCState(
        init_msg : Principal,
        args : {
            icrc7_args : ?ICRC7.InitArgs;
            icrc37_args : ?ICRC37.InitArgs;
            icrc3_args : ICRC3.InitArgs;
        },
    ) : ICRCState {
        let icrc7_migration_state = ICRC7.init(
            ICRC7.initialState(),
            #v0_1_0(#id),
            switch (args.icrc7_args) {
                case (null) ICRC7Default.defaultConfig(init_msg);
                case (?val) val;
            },
            init_msg,
        );

        let #v0_1_0(#data(icrc7_state_current)) = icrc7_migration_state;

        let icrc37_migration_state = ICRC37.init(
            ICRC37.initialState(),
            #v0_1_0(#id),
            switch (args.icrc37_args) {
                case (null) ICRC37Default.defaultConfig(init_msg);
                case (?val) val;
            },
            init_msg,
        );

        let #v0_1_0(#data(icrc37_state_current)) = icrc37_migration_state;

        let icrc3_migration_state = ICRC3.init(
            ICRC3.initialState(),
            #v0_1_0(#id),
            switch (args.icrc3_args) {
                case (null) ICRC3Default.defaultConfig(init_msg);
                case (?val) ?val : ICRC3.InitArgs;
            },
            init_msg,
        );

        let #v0_1_0(#data(icrc3_state_current)) = icrc3_migration_state;

        {
            icrc3_migration_state;
            icrc7_migration_state;
            icrc37_migration_state;
            icrc3_state_current;
            icrc7_state_current;
            icrc37_state_current;
        };
    };

    public func createICRCInstances(state : ICRCState, env : ICRCEnvironment) : ICRCInstances {
        let ct = CertTree.Ops(env.cert_store);

        let icrc3 = ICRC3.ICRC3(
            ?state.icrc3_migration_state,
            env.canister(),
            ?{
                updated_certification = ?(
                    func(cert : Blob, lastIndex : Nat) : Bool {
                        ct.setCertifiedData();
                        true;
                    }
                );
                get_certificate_store = ?(
                    func() : CertTree.Store {
                        env.cert_store;
                    }
                );
            },
        );

        let icrc7 = ICRC7.ICRC7(
            ?state.icrc7_migration_state,
            env.canister(),
            {
                canister = env.canister;
                get_time = env.get_time;
                refresh_state = func() : ICRC7.CurrentState {
                    state.icrc7_state_current;
                };
                add_ledger_transaction = ?icrc3.add_record;
                can_mint = null;
                can_burn = null;
                can_transfer = null;
                can_update = null;
            },
        );

        let icrc37 = ICRC37.ICRC37(
            ?state.icrc37_migration_state,
            env.canister(),
            {
                canister = env.canister;
                get_time = env.get_time;
                refresh_state = func() : ICRC37.CurrentState {
                    state.icrc37_state_current;
                };
                icrc7 = icrc7;
                can_transfer_from = null;
                can_approve_token = null;
                can_approve_collection = null;
                can_revoke_token_approval = null;
                can_revoke_collection_approval = null;
            },
        );

        { icrc3; icrc7; icrc37 };
    };
};
