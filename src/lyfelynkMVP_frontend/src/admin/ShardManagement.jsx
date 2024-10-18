import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WasmModuleUploader from "./WasmModuleUploader";

const ShardManagement = () => {
  const [activeTab, setActiveTab] = useState("user");

  const shardTypes = [
    "user",
    "professional",
    "facility",
    "dataAsset",
    "marketplace",
    "sharedActivity",
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        {shardTypes.map((type) => (
          <TabsTrigger key={type} value={type} className="capitalize">
            {type}
          </TabsTrigger>
        ))}
      </TabsList>
      {shardTypes.map((type) => (
        <TabsContent key={type} value={type}>
          <h2 className="text-2xl font-bold mb-4 capitalize">
            {type} Shard Management
          </h2>
          <WasmModuleUploader shardType={type} />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ShardManagement;
