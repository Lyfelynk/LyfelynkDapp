import React, { useState, useEffect, useContext } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import ActorContext from "../../ActorContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Calendar,
  User,
  Briefcase,
  Building,
  Trash2,
  Plus,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

const GamificationTab = () => {
  const { actors } = useContext(ActorContext);
  const { toast } = useToast();
  const [avatars, setAvatars] = useState([]);
  const [pendingVisits, setPendingVisits] = useState([]);
  const [professionalInfo, setProfessionalInfo] = useState({
    name: "",
    specialization: "",
    availableSlots: [],
  });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

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
      if (result.ok) {
        setProfessionalInfo(result.ok);
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
        BigInt(startDate.getTime()) * BigInt(1000000),
        BigInt(endDate.getTime()) * BigInt(1000000),
      ];
      setProfessionalInfo((prev) => ({
        ...prev,
        availableSlots: [...prev.availableSlots, newSlot],
      }));
      setStartDate(null);
      setEndDate(null);
    } else {
      toast({
        title: "Error",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSlot = (index) => {
    setProfessionalInfo((prev) => ({
      ...prev,
      availableSlots: prev.availableSlots.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateProfessionalInfo = async (event) => {
    event.preventDefault();
    try {
      const result = await actors.visitManager.updateProfessionalInfo(
        professionalInfo.name,
        professionalInfo.specialization,
        professionalInfo.availableSlots,
      );
      if (result && result.ok !== undefined) {
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

  const formatTime = (nanoseconds) => {
    const milliseconds = Number(nanoseconds) / 1000000;
    const date = new Date(milliseconds);
    return date.toLocaleString();
  };

  const handleVisit = async (visitId, action) => {
    try {
      let result;
      const visit = pendingVisits.find((v) => v.visitId === visitId);
      const avatarId = visit ? visit.avatarId : null;

      if (action === "complete") {
        if (avatarId === null) {
          throw new Error("No avatar available to complete the visit");
        }
        result = await actors.gamificationSystem.completeVisit(
          visitId,
          avatarId,
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

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Professional Profile</TabsTrigger>
          <TabsTrigger value="visits">Pending Visits</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
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
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={professionalInfo.specialization}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Available Slots</Label>
                  <div className="mt-2 space-y-2">
                    {professionalInfo.availableSlots.length > 0 ? (
                      professionalInfo.availableSlots.map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <Badge variant="secondary" className="text-sm">
                            {`${formatTime(slot[0])} - ${formatTime(slot[1])}`}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSlot(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <p>No available slots. Add some below.</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-2">
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      showTimeSelect
                      dateFormat="Pp"
                      placeholderText="Start Date"
                      className="w-full sm:w-auto px-3 py-2 border rounded-md"
                    />
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
                      showTimeSelect
                      dateFormat="Pp"
                      placeholderText="End Date"
                      className="w-full sm:w-auto px-3 py-2 border rounded-md"
                    />
                    <Button
                      type="button"
                      onClick={handleAddSlot}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Slot
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Information
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="visits">
          <Card>
            <CardHeader>
              <CardTitle>Pending Visits</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingVisits.length > 0 ? (
                <div className="space-y-4">
                  {pendingVisits.map((visit) => (
                    <Card key={visit.visitId} className="p-4">
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>User ID: {Number(visit.userId)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          <span>
                            Duration: {Number(visit.duration)} minutes
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>
                            Date:{" "}
                            {new Date(
                              Number(visit.timestamp) / 1000000,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="mr-2 h-4 w-4" />
                          <span>
                            Professional ID: {visit.professionalId || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Building className="mr-2 h-4 w-4" />
                          <span>
                            Facility ID: {Number(visit.facilityId) || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          onClick={() => handleVisit(visit.visitId, "complete")}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete
                        </Button>
                        <Button
                          onClick={() => handleVisit(visit.visitId, "reject")}
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">No pending visits at the moment.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificationTab;
