import React from "react";
import { ShareSellTable } from "../../../Health-Service/Tables/ShareSellData";

export default function YourRecords() {
  return (
    <div>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center p-8">
          <h1 className="mt-4 text-4xl font-bold">Your Health Records</h1>
          <p className="mt-2 text-lg text-gray-600">
            Choose the documents below to share or sell the data.
          </p>

          <div className="mt-4 w-full max-w-2xl">
            <ShareSellTable shareMode />
          </div>
        </div>
      </div>
    </div>
  );
}
