import React, { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ActorContext from "../ActorContext";
import { toast } from "@/components/ui/use-toast";
function MintNFTForm() {
  const { actors } = useContext(ActorContext);
  const [userPrincipal, setUserPrincipal] = useState("");
  const [avatarType, setAvatarType] = useState("");
  const [message, setMessage] = useState("");

  const handleMint = async () => {
    if (!userPrincipal || !avatarType) {
      setMessage("Please fill in all fields");
      return;
    }

    try {
      const result = await actors.gamificationSystem.mintWellnessAvatar(
        userPrincipal,
        [],
        avatarType,
        "https://gateway.lighthouse.storage/ipfs/bafkreihhnhf2wasvj7r3gywekm3lpgbiulpov6xwhcv2var2am4c3fn6wm",
      );
      console.log(result);
      if (result.ok) {
        toast({
          title: "NFT minted successfully",
          description: `NFT minted successfully for ${userPrincipal}`,
        });
      } else {
        toast({
          title: "Error minting NFT",
          description: JSON.stringify(result[0].Err),
        });
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
      toast({
        title: "Error minting NFT",
        description: "Error minting NFT. Please try again.",
      });
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Mint NFT for User</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="User Principal ID"
            value={userPrincipal}
            onChange={(e) => setUserPrincipal(e.target.value)}
          />
          <Select onValueChange={setAvatarType}>
            <SelectTrigger>
              <SelectValue placeholder="Select Avatar Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="User">User</SelectItem>
              <SelectItem value="Professional">Professional</SelectItem>
              <SelectItem value="Facility">Facility</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleMint}>Mint NFT</Button>
          {message && <p className="text-sm text-gray-600">{message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default MintNFTForm;
