import React, { useState } from "react";
import { useCanister } from "@connect2ic/react";
import { Principal } from "@dfinity/principal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

export default function Wallet() {
  const [icrc1_ledger_canister] = useCanister("icrc1_ledger_canister");
  const [lyfelynkMVP_backend] = useCanister("lyfelynkMVP_backend");
  const [approveAmount, setApproveAmount] = useState("");
  const [allowanceValue, setAllowanceValue] = useState(0);
  const [balance, setBalance] = useState(0);
  const [requestAmount, setRequestAmount] = useState(0);

  const approveSpendToken = async () => {
    const approveArgument = {
      fee: [],
      memo: [],
      from_subaccount: [],
      created_at_time: [],
      amount: approveAmount * 100000000,
      expected_allowance: [],
      expires_at: [],
      spender: {
        owner: Principal.fromText("cn6uk-5aaaa-aaaag-ak43q-cai"),
        subaccount: [],
      },
    };
    const result = await icrc1_ledger_canister.icrc2_approve(approveArgument);

    if ("Err" in result) {
      console.error(result.Err);
    } else if ("Ok" in result) {
      toast({
        title: "Success",
        description: "Allowed to spend token",
        variant: "success",
      });
    }
  };

  const getAllowance = async () => {
    try {
      const principal = await lyfelynkMVP_backend.whoami();
      const allowanceArgument = {
        account: {
          owner: Principal.fromText(principal),
          subaccount: [],
        },
        spender: {
          owner: Principal.fromText("cn6uk-5aaaa-aaaag-ak43q-cai"),
          subaccount: [],
        },
      };
      const result =
        await icrc1_ledger_canister.icrc2_allowance(allowanceArgument);

      if ("allowance" in result) {
        setAllowanceValue(Number(result.allowance) / 100000000);
      } else if ("err" in result) {
        console.error(result.err);
      }
    } catch (error) {
      console.error("Error getting allowance:", error);
    }
  };

  const getBalance = async () => {
    try {
      const principal = await lyfelynkMVP_backend.whoami();
      const result = await icrc1_ledger_canister.icrc1_balance_of({
        owner: Principal.fromText(principal),
        subaccount: [],
      });
      setBalance(Number(result) / 100000000);
    } catch (error) {
      console.error("Error getting balance:", error);
    }
  };

  const sendTokenRequest = async () => {
    try {
      const result = await lyfelynkMVP_backend.requestForTokens(requestAmount);
      if ("err" in result) {
        console.error(result.err);
      } else if ("ok" in result) {
        toast({
          title: "Success",
          description: result.ok,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error sending token request:", error);
    }
  };

  return (
    <Card className="w-full bg-transparent border-2 border-gray-600">
      <CardHeader>
        <CardTitle>Wallet</CardTitle>
        <CardDescription>Manage your token allowances.</CardDescription>
      </CardHeader>
      <div className="border border-gray-600 mb-4 "></div>
      <CardContent>
        <div className="md:grid grid-cols-2 gap-4">
          <div className="space-y-2 pb-2">
            <Label>Current allowance</Label>
            <p className="text-3xl pb-2 font-semibold">
              {allowanceValue} LYF Tokens
            </p>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={getAllowance}
            >
              Update Current Allowance Amount
            </Button>
          </div>
          <div className="space-y-2 pb-2">
            <Label>Your Balance</Label>
            <p className="text-3xl pb-2 font-semibold">{balance} LYF Tokens</p>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={getBalance}
            >
              Update Current Balance Amount
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="allowance">Limit token spending amount</Label>
            <Input
              id="allowance"
              placeholder="Enter allowance"
              type="number"
              min="0"
              value={approveAmount}
              onChange={(e) => setApproveAmount(e.target.value)}
            />
            <Button size="sm" type="button" onClick={approveSpendToken}>
              Submit
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="request">Request tokens to be airdropped</Label>
            <Input
              id="request"
              placeholder="Enter amount"
              type="number"
              min="0"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
            />
            <Button type="button" onClick={sendTokenRequest}>
              Send request
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
