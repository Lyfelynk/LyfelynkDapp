import React, { useState } from "react";
import { Upload, RefreshCw, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function WasmModuleUploader() {
  const [wasmFile, setWasmFile] = useState(null);
  const [selectedModule, setSelectedModule] = useState("User");
  const [message, setMessage] = useState("");

  const handleWasmFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setWasmFile(event.target.files[0]);
    }
  };

  const handleUpdateWasmModule = (event) => {
    event.preventDefault();
    if (wasmFile) {
      switch (selectedModule) {
        case "User":
          setMessage(`WASM module "${wasmFile.name}" update for User is not implemented`);
          break;
        case "Professional":
          setMessage(`WASM module "${wasmFile.name}" update for Professional is not implemented`);
          break;
        case "Facility":
          setMessage(`WASM module "${wasmFile.name}" update for Facility is not implemented`);
          break;
        case "DataAsset":
          setMessage(`WASM module "${wasmFile.name}" update for DataAsset is not implemented`);
          break;
        case "Marketplace":
          setMessage(`WASM module "${wasmFile.name}" update for Marketplace is not implemented`);
          break;
        default:
          setMessage("Unknown module selected");
      }
    } else {
      setMessage("Please select a WASM file");
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold">
          <RefreshCw className="mr-2 h-6 w-6" />
          Update WASM Module
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleUpdateWasmModule} className="space-y-6">
          <div className="flex flex-col space-y-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center justify-between w-64">
                  {selectedModule}
                  <ChevronDown className="ml-2 w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                <DropdownMenuLabel>Select Module</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setSelectedModule("User")}>
                  User
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSelectedModule("Professional")}>
                  Professional
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSelectedModule("Facility")}>
                  Facility
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSelectedModule("DataAsset")}>
                  DataAsset
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSelectedModule("Marketplace")}>
                  Marketplace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div
              className="flex items-center justify-center w-full h-32 p-4 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-gray-400 focus:outline-none"
              onClick={() => document.getElementById("file-upload").click()}
            >
              <span className="flex items-center space-x-2 text-gray-600">
                <Upload className="w-6 h-6" />
                <span className="font-medium">
                  {wasmFile ? wasmFile.name : "Click to upload WASM file"}
                </span>
              </span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".wasm"
                className="hidden"
                onChange={handleWasmFileChange}
              />
            </div>
            <Button type="submit" className="w-full">
              Upload
            </Button>
          </div>
        </form>
        {message && (
          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Update Status</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default WasmModuleUploader;
