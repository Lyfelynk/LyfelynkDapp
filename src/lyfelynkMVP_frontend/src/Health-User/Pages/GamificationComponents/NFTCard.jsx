import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { QUALITY_TIERS } from "./constants";

const NFTCard = ({ nft, onVisit, isPending, showManage = false, onManage }) => {
  const qualityStyles = QUALITY_TIERS[nft.quality];

  return (
    <Card className="bg-gray-800 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out">
      <CardHeader className="border-b border-gray-700">
        <h2 className="text-2xl font-bold">{nft.type}</h2>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex items-center mb-4">
          <span className="font-medium">Quality:</span>
          <span
            className={`ml-2 inline-block px-3 py-1 text-sm font-semibold ${qualityStyles.bg} ${qualityStyles.text} rounded-full`}
          >
            {nft.quality}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-left">
            <p>
              <span className="font-medium">Daily Capacity:</span>{" "}
              {nft.dailyCapacity}
            </p>
          </div>
          <div className="text-left">
            <p>
              <span className="font-medium">Visit Count:</span> {nft.visitCount}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="py-2 border-t border-gray-700 flex justify-between">
        {showManage ? (
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onManage(nft)}
          >
            Manage
          </Button>
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
