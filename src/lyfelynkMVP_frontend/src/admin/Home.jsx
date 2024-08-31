import React, { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Home = () => {
  const [professionals, setProfessionals] = useState([
    {
      id: 1,
      name: "John Doe",
      occupation: "Doctor",
      certificationId: "DOC123",
      company: "City Hospital",
      status: "pending",
    },
    {
      id: 2,
      name: "Jane Smith",
      occupation: "Nurse",
      certificationId: "NUR456",
      company: "County Clinic",
      status: "pending",
    },
    {
      id: 3,
      name: "Mike Johnson",
      occupation: "Therapist",
      certificationId: "THE789",
      company: "Mind Wellness",
      status: "pending",
    },
  ]);

  const [facilities, setFacilities] = useState([
    {
      id: 1,
      name: "City Hospital",
      registrationId: "CH001",
      serviceName: "Emergency Care",
      serviceDesc: "24/7 emergency medical services",
      status: "pending",
    },
    {
      id: 2,
      name: "County Clinic",
      registrationId: "CC002",
      serviceName: "General Practice",
      serviceDesc: "Primary care and routine check-ups",
      status: "pending",
    },
    {
      id: 3,
      name: "Mind Wellness",
      registrationId: "MW003",
      serviceName: "Mental Health",
      serviceDesc: "Counseling and therapy services",
      status: "pending",
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [message, setMessage] = useState("");
  const [wasmFile, setWasmFile] = useState(null);

  const handleStatusChange = (type, id, action) => {
    setCurrentAction({ type, id, action });
    setIsDialogOpen(true);
  };

  const confirmStatusChange = () => {
    if (currentAction) {
      const { type, id, action } = currentAction;
      const newStatus = action === "approve" ? "approved" : "denied";

      if (type === "professional") {
        setProfessionals(
          professionals.map((p) =>
            p.id === id ? { ...p, status: newStatus } : p
          )
        );
      } else {
        setFacilities(
          facilities.map((f) =>
            f.id === id ? { ...f, status: newStatus } : f
          )
        );
      }

      setIsDialogOpen(false);
      setCurrentAction(null);
    }
  };

  const StatusBadge = ({ status }) => {
    const colorMap = {
      pending: "bg-yellow-500",
      approved: "bg-green-500",
      denied: "bg-red-500",
    };
    return <Badge className={`${colorMap[status]} text-white`}>{status}</Badge>;
  };

  const handleWasmFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setWasmFile(event.target.files[0]);
    }
  };

  const handleUpdateWasmModule = (event) => {
    event.preventDefault();
    if (wasmFile) {
      setMessage(
        `WASM module "${wasmFile.name}" update functionality not implemented`
      );
    } else {
      setMessage("Please select a WASM file");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
      <Tabs defaultValue="professional" className="w-full mb-8">
        <TabsList>
          <TabsTrigger value="professional">Professional Approval</TabsTrigger>
          <TabsTrigger value="facility">Facility Approval</TabsTrigger>
        </TabsList>
        <TabsContent value="professional">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Occupation</TableHead>
                <TableHead>Certification ID</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionals.map((pro) => (
                <TableRow key={pro.id}>
                  <TableCell>{pro.name}</TableCell>
                  <TableCell>{pro.occupation}</TableCell>
                  <TableCell>{pro.certificationId}</TableCell>
                  <TableCell>{pro.company}</TableCell>
                  <TableCell><StatusBadge status={pro.status} /></TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() =>
                        handleStatusChange("professional", pro.id, "approve")
                      }
                      disabled={pro.status !== "pending"}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleStatusChange("professional", pro.id, "deny")
                      }
                      disabled={pro.status !== "pending"}
                    >
                      Deny
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="facility">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility Name</TableHead>
                <TableHead>Registration ID</TableHead>
                <TableHead>Service Name</TableHead>
                <TableHead>Service Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilities.map((fac) => (
                <TableRow key={fac.id}>
                  <TableCell>{fac.name}</TableCell>
                  <TableCell>{fac.registrationId}</TableCell>
                  <TableCell>{fac.serviceName}</TableCell>
                  <TableCell>{fac.serviceDesc}</TableCell>
                  <TableCell><StatusBadge status={fac.status} /></TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() =>
                        handleStatusChange("facility", fac.id, "approve")
                      }
                      disabled={fac.status !== "pending"}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleStatusChange("facility", fac.id, "deny")
                      }
                      disabled={fac.status !== "pending"}
                    >
                      Deny
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <Card className="mb-8">
        <CardHeader>
            <CardTitle>Update WASM Module</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleUpdateWasmModule} className="space-y-4">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                Choose a WASM file to upload
                </label>
                <div className="flex items-center space-x-4">
                <div
                    className="flex items-center justify-center w-full h-12 px-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 transition"
                    onClick={() => document.getElementById("file-input")?.click()}
                >
                    <span className="text-sm">
                    {wasmFile ? wasmFile.name : "Click to select a file"}
                    </span>
                </div>
                <input
                    id="file-input"
                    type="file"
                    accept=".wasm"
                    onChange={handleWasmFileChange}
                    className="hidden"
                />
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Upload
                </Button>
                </div>
            </div>
            </form>
            <div className="mt-4">
            <h2 className="text-lg font-semibold">Message:</h2>
            <p className="text-sm text-gray-600">{message}</p>
            </div>
        </CardContent>
      </Card>



      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to {currentAction?.action} this{" "}
              {currentAction?.type}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
