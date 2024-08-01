import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShareSellTable } from "../../Health-Service/Tables/ShareSellData";
import { DataReceivedTable } from "../../Health-Service/Tables/DataReceived";

export default function Records() {
  return (
    <div>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="flex items-center justify-between w-full"></div>
          <h1 className="mt-4 text-4xl font-bold">
            Find and Share your Health Data
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Choose the documents below to share or sell the data.
          </p>

          <div className="mt-4 w-full max-w-2xl">
            <Tabs defaultValue="uploadedfiles" className="mt-4">
              <TabsList className="w-full flex">
                <TabsTrigger
                  value="uploadedfiles"
                  className="w-1/2 text-center"
                >
                  Your Uploads
                </TabsTrigger>
                <TabsTrigger
                  value="shareddocuments"
                  className="w-1/2 text-center"
                >
                  Shared With You
                </TabsTrigger>
              </TabsList>

              <TabsContent value="uploadedfiles">
                <ShareSellTable shareMode />
              </TabsContent>

              <TabsContent value="shareddocuments">
                <DataReceivedTable />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
