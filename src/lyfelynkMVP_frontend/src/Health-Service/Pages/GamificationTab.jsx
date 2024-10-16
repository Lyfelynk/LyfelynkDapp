import React, { useState, useEffect, useContext } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import ActorContext from "../../ActorContext";

const GamificationTab = () => {
  const { actors } = useContext(ActorContext);
  const [avatars, setAvatars] = useState([]);
  const [pendingVisits, setPendingVisits] = useState([]);
  const [serviceInfo, setServiceInfo] = useState({
    name: "",
    description: "",
    location: "",
    availableSlots: [],
  });

  useEffect(() => {
    fetchAvatars();
    fetchPendingVisits();
    fetchServiceInfo();
  }, []);

  const fetchAvatars = async () => {
    try {
      const result = await actors.gamificationSystem.getUserAvatarsSelf();
      setAvatars(result);
    } catch (error) {
      console.error("Error fetching avatars:", error);
      toast({
        title: "Error",
        description: "Failed to fetch avatars",
        variant: "destructive",
      });
    }
  };

  const fetchPendingVisits = async () => {
    try {
      const result = await actors.visitManager.getPendingVisits();
      setPendingVisits(result.ok || []);
    } catch (error) {
      console.error("Error fetching pending visits:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pending visits",
        variant: "destructive",
      });
    }
  };

  const fetchServiceInfo = async () => {
    try {
      const result = await actors.visitManager.getServiceInfoSelf();
      if (result.ok) {
        setServiceInfo(result.ok);
        // Fetch available slots for the professional
        const slotsResult = await actors.visitManager.getAvailableSlots(
          result.ok.id,
        ); // Assuming result.ok.id is the professional ID
        if (slotsResult.ok) {
          setServiceInfo((prev) => ({
            ...prev,
            availableSlots: slotsResult.ok,
          }));
        } else {
          throw new Error(slotsResult.err);
        }
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error("Error fetching service info:", error);
      toast({
        title: "Error",
        description: "Failed to fetch service information",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "availableSlots") {
      // Split the input by commas and parse each slot
      const slots = value.split(",").map((slot) => {
        const [start, end] = slot.trim().split("-");
        return [
          new Date(start.trim()).getTime() * 1000000, // Convert to nanoseconds
          new Date(end.trim()).getTime() * 1000000,
        ];
      });
      setServiceInfo((prev) => ({ ...prev, [name]: slots }));
    } else {
      setServiceInfo((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdateServiceInfo = async () => {
    try {
      const result = await actors.visitManager.updateServiceInfo(
        serviceInfo.name,
        serviceInfo.description,
        serviceInfo.location,
        serviceInfo.availableSlots,
      );
      if (result.ok) {
        toast({
          title: "Success",
          description: "Service information updated successfully",
        });
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error("Error updating service info:", error);
      toast({
        title: "Error",
        description: "Failed to update service information",
        variant: "destructive",
      });
    }
  };

  const handleVisit = async (visitId, action, avatarId) => {
    // Add avatarId parameter
    try {
      let result;
      if (action === "complete") {
        result = await actors.gamificationSystem.completeVisit(
          visitId,
          avatarId, // Pass avatar ID
        );
      } else if (action === "reject") {
        result = await actors.gamificationSystem.rejectVisit(visitId);
      }

      if (result.ok) {
        toast({
          title: "Success",
          description: `Visit ${action === "complete" ? "completed" : "rejected"} successfully`,
        });
        fetchPendingVisits();
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error(`Error ${action}ing visit:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} visit`,
        variant: "destructive",
      });
    }
  };

  // Helper function to format time for display
  const formatTime = (nanoseconds) => {
    const date = new Date(nanoseconds / 1000000); // Convert nanoseconds to milliseconds
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Update Service Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                name="name"
                value={serviceInfo.name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={serviceInfo.description}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={serviceInfo.location}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="availableSlots">Available Slots</Label>
              <Input
                id="availableSlots"
                name="availableSlots"
                value={serviceInfo.availableSlots
                  .map(
                    ([start, end]) =>
                      `${formatTime(start)} - ${formatTime(end)}`,
                  )
                  .join(", ")}
                onChange={handleInputChange}
                placeholder="e.g. 2023-05-01 09:00:00 - 2023-05-01 10:00:00, 2023-05-01 14:00:00 - 2023-05-01 15:00:00"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter comma-separated time slots in the format: "YYYY-MM-DD
                HH:MM:SS - YYYY-MM-DD HH:MM:SS"
              </p>
            </div>
            <Button onClick={handleUpdateServiceInfo}>
              Update Information
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Avatars</CardTitle>
        </CardHeader>
        <CardContent>
          {avatars.map(([tokenId, metadata]) => (
            <div key={tokenId} className="mb-4">
              <h3 className="text-lg font-semibold">Avatar #{tokenId}</h3>
              <p>Type: {metadata[0][3].value.Class[5].value.Text}</p>
              <p>Quality: {metadata[0][3].value.Class[4].value.Text}</p>
              <p>Level: {metadata[0][3].value.Class[6].value.Nat}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Visits</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingVisits.map((visit) => (
            <div key={visit.visitId} className="mb-4">
              <p>Visit ID: {visit.visitId}</p>
              <p>User ID: {visit.userId}</p>
              <p>
                Timestamp:{" "}
                {new Date(Number(visit.timestamp) / 1000000).toLocaleString()}
              </p>
              <Button
                onClick={() =>
                  handleVisit(visit.visitId, "complete", visit.avatarId)
                } // Pass avatar ID
                className="mr-2"
              >
                Complete
              </Button>
              <Button
                onClick={() => handleVisit(visit.visitId, "reject")}
                variant="destructive"
              >
                Reject
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default GamificationTab;
