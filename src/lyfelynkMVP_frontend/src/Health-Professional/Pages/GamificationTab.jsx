import React, { useState, useEffect, useContext } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import ActorContext from "../../ActorContext";
import DatePicker from "react-datepicker"; // Import the date picker
import "react-datepicker/dist/react-datepicker.css"; // Import the CSS for the date picker

const GamificationTab = () => {
  const { actors } = useContext(ActorContext);
  const [avatars, setAvatars] = useState([]);
  const [pendingVisits, setPendingVisits] = useState([]);
  const [professionalInfo, setProfessionalInfo] = useState({
    name: "",
    specialization: "",
    availableSlots: [],
  });
  const [startDate, setStartDate] = useState(null); // State for start date
  const [endDate, setEndDate] = useState(null); // State for end date

  useEffect(() => {
    fetchAvatars();
    fetchPendingVisits();
    fetchProfessionalInfo();
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
      console.log(result);
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

  const fetchProfessionalInfo = async () => {
    try {
      const result = await actors.visitManager.getProfessionalInfoSelf();
      console.log(result);
      if (result.ok) {
        setProfessionalInfo(result.ok); // This should include available slots
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error("Error fetching professional info:", error);
      toast({
        title: "Error",
        description: "Failed to fetch professional information",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfessionalInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSlot = () => {
    if (startDate && endDate) {
      const newSlot = [
        BigInt(startDate.getTime()) * BigInt(1000000), // Convert to nanoseconds
        BigInt(endDate.getTime()) * BigInt(1000000), // Convert to nanoseconds
      ];
      setProfessionalInfo((prev) => ({
        ...prev,
        availableSlots: [...prev.availableSlots, newSlot],
      }));
      setStartDate(null); // Reset start date
      setEndDate(null); // Reset end date
    } else {
      toast({
        title: "Error",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProfessionalInfo = async (event) => {
    event.preventDefault();
    try {
      const result = await actors.visitManager.updateProfessionalInfo(
        professionalInfo.name,
        professionalInfo.specialization,
        professionalInfo.availableSlots
      );
      console.log(result);
      if (result.ok) {
        toast({
          title: "Success",
          description: "Professional information updated successfully",
        });
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error("Error updating professional info:", error);
      toast({
        title: "Error",
        description: "Failed to update professional information",
        variant: "destructive",
      });
    }
  };

  // Helper function to format time for display
  const formatTime = (nanoseconds) => {
    const milliseconds = Number(nanoseconds) / 1000000; // Convert BigInt to Number
    const date = new Date(milliseconds); // Create a Date object
    return date.toLocaleString(); // Format the date
  };

  const handleVisit = async (visitId, action) => {
    try {
      let result;
      const visit = pendingVisits.find((v) => v.visitId === visitId); // Find the visit object
      const avatarId = visit ? visit.avatarId : null; // Get the avatarId from the visit

      if (action === "complete") {
        if (avatarId === null) {
          throw new Error("No avatar available to complete the visit");
        }
        result = await actors.gamificationSystem.completeVisit(
          visitId,
          avatarId
        );
        console.log(result);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Update Professional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleUpdateProfessionalInfo}
          >
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={professionalInfo.name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                name="specialization"
                value={professionalInfo.specialization}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="availableSlots">Available Slots</Label>
              <div className="flex flex-col">
                {professionalInfo.availableSlots.map((slot, index) => (
                  <div key={index}>
                    {`${formatTime(slot[0])} - ${formatTime(slot[1])}`}
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  showTimeSelect
                  dateFormat="Pp"
                  placeholderText="Start Date"
                />
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  showTimeSelect
                  dateFormat="Pp"
                  placeholderText="End Date"
                />
                <Button
                  type="button"
                  onClick={handleAddSlot}
                >
                  Add Slot
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Select start and end dates, then click "Add Slot".
              </p>
            </div>
            <Button type="submit">Update Information</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Visits</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingVisits.map((visit) => (
            <div
              key={visit.visitId}
              className="mb-4"
            >
              <p>Visit ID: {visit.visitId}</p>
              <p>User ID: {visit.userId}</p>
              <p>
                Timestamp:{" "}
                {new Date(Number(visit.timestamp) / 1000000).toLocaleString()}
              </p>
              <Button
                onClick={() => handleVisit(visit.visitId, "complete")}
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
