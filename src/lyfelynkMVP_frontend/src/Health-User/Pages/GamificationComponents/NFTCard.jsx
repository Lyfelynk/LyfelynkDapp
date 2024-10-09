import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { QUALITY_TIERS } from "./constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const NFTCard = ({
  nft,
  onVisit,
  isPending,
  showManage = false,
  onManage,
  onTransfer,
}) => {
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [principalAddress, setPrincipalAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const qualityStyles = QUALITY_TIERS[nft.quality];

  const handleTransfer = async () => {
    if (!principalAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid principal address.",
        variant: "destructive",
      });
      return;
    }

    setIsTransferring(true);
    try {
      await onTransfer(nft.id, principalAddress);
      setIsTransferOpen(false);
      setPrincipalAddress("");
      toast({
        title: "Success",
        description: "NFT transferred successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to transfer NFT. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Card className="bg-gray-800 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out">
      <CardHeader className="border-b border-gray-700">
        <h2 className="text-2xl font-bold">{nft.name}</h2>
        <Badge className={`${qualityStyles.bg} ${qualityStyles.text} w-fit`}>
          {nft.quality}
        </Badge>
      </CardHeader>

      <CardContent className="p-4">
        <p className="text-sm text-gray-400 mb-4">{nft.description}</p>

        <div className="grid grid-cols-2 gap-4">
          {Object.entries(nft.attributes).map(([key, value]) => (
            <div key={key} className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase">{key}</span>
              <span className="text-lg font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="py-2 border-t border-gray-700 flex justify-between">
        {showManage ? (
          <>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onManage(nft)}
            >
              Manage
            </Button>
            <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Transfer
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle>Transfer NFT</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col space-y-4">
                  <Input
                    placeholder="Enter principal address"
                    value={principalAddress}
                    onChange={(e) => setPrincipalAddress(e.target.value)}
                    className="bg-gray-700 text-white"
                  />
                  <Button
                    onClick={handleTransfer}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isTransferring}
                  >
                    {isTransferring ? (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                        Transferring...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Transfer
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => onVisit(nft)}
            disabled={isPending}
          >
            {isPending ? "Pending..." : "Visit"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default NFTCard;
