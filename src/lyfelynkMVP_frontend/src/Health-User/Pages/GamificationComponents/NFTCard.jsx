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
import { Send, AlertCircle, Eye } from "lucide-react";
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
    <Card className="bg-gray-800/40 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-pink-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 via-cyan-500/20 to-pink-100/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"></div>
      <div className="relative z-10">
        <CardHeader className="border-b border-gray-700 flex flex-row items-center space-x-4">
          <img
            src={nft.image}
            alt={nft.name}
            className="w-20 h-20 rounded-lg object-cover"
          />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{nft.name}</h2>
            </div>
            <Badge
              className={`${qualityStyles.bg} ${qualityStyles.text} w-fit`}
            >
              {nft.quality}
            </Badge>
            <p className="text-sm text-gray-400">{nft.type}</p>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(nft).map(([key, value]) => {
              if (
                typeof value !== "object" &&
                ![
                  "id",
                  "name",
                  "description",
                  "image",
                  "type",
                  "quality",
                ].includes(key)
              ) {
                return (
                  <div key={key} className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase">
                      {key}
                    </span>
                    <span className="text-lg font-semibold">{value}</span>
                  </div>
                );
              }

              return null;
            })}
          </div>
          <div className="mt-4 flex items-center">
            <Eye className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-sm text-gray-400">
              Visits: {nft.visitCount || 0}
            </span>
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
              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
              onClick={() => onVisit(nft)}
              disabled={isPending}
            >
              {isPending ? "Pending..." : "Visit"}
            </Button>
          )}
        </CardFooter>
      </div>
    </Card>
  );
};

export default NFTCard;
