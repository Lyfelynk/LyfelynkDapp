import React from "react";
import { DataReceivedTable } from "../../../Health-Service/Tables/DataReceived";

export default function SharedWithYou() {
  return (
    <div>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center p-8">
          <h1 className="mt-4 text-4xl font-bold">Records Shared With You</h1>
          <p className="mt-2 text-lg text-gray-600">
            View the health records that have been shared with you.
          </p>

          <div className="mt-4 w-full max-w-2xl">
            <DataReceivedTable />
          </div>
        </div>
      </div>
    </div>
  );
}