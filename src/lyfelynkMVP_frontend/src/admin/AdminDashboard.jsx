import React, { useState, useContext } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, Database, Coins, UserPlus } from "lucide-react";
import ProfessionalApproval from "./ProfessionalApproval";
import FacilityApproval from "./FacilityApproval";
import ShardManagement from "./ShardManagement";
import NFTManagement from "./NFTManagement";
import ActorContext from "../ActorContext";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("professionals");
  const { actors } = useContext(ActorContext);

  const tabs = [
    { id: "professionals", label: "Professional Approval", icon: <Users /> },
    { id: "facilities", label: "Facility Approval", icon: <Building2 /> },
    { id: "shards", label: "Shard Management", icon: <Database /> },
    { id: "nfts", label: "NFT Management", icon: <Coins /> },
  ];

  const adminRegister = async () => {
    try {
      // Replace this with the actual method to register an admin
      const result = await actors.admin.registerAdmin();
      if (result.ok) {
        console.log("Admin registered successfully");
        // You might want to show a success message to the user here
      } else {
        console.error("Error registering admin:", result.err);
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error("Error registering admin:", error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 bg-card text-card-foreground p-4">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <Button
          onClick={adminRegister}
          className="w-full justify-start mb-4"
          variant="outline"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Register Admin
        </Button>
        <nav>
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              className="w-full justify-start mb-2"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </Button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Card>
          <CardHeader>
            <CardTitle>
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="professionals">
                <ProfessionalApproval />
              </TabsContent>
              <TabsContent value="facilities">
                <FacilityApproval />
              </TabsContent>
              <TabsContent value="shards">
                <ShardManagement />
              </TabsContent>
              <TabsContent value="nfts">
                <NFTManagement />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
