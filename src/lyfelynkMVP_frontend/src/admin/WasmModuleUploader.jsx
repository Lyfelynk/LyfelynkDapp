import React from "react";
import { useState, useContext } from "react";
import { Upload, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import ActorContext from "../ActorContext";

function WasmModuleUploader({ shardType }) {
  const { actors, login, logout } = useContext(ActorContext);
  const [wasmFile, setWasmFile] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleWasmFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setWasmFile(event.target.files[0]);
    }
  };

  const handleUpdateWasmModule = async (event) => {
    event.preventDefault();
    if (!wasmFile) {
      setMessage("Please select a WASM file first.");
      return;
    }

    try {
      const arrayBuffer = await readFile(wasmFile);
      const byteArray = [...new Uint8Array(arrayBuffer)];

      let result;
      switch (shardType) {
        case "user":
          result = await actors.user.updateUserShardWasmModule(byteArray);
          break;
        case "professional":
          result =
            await actors.professional.updateProfessionalShardWasmModule(
              byteArray,
            );
          break;
        case "facility":
          result =
            await actors.facility.updateFacilityShardWasmModule(byteArray);
          break;
        case "dataAsset":
          result =
            await actors.dataAsset.updateDataAssetShardWasmModule(byteArray);
          break;
        case "marketplace":
          result = await actors.marketplace.updateWasmModule(byteArray);
          break;
        case "sharedActivity":
          result = await actors.sharedActivity.updateWasmModule(byteArray);
          break;
        default:
          setMessage("Unknown shard type");
          return;
      }

      if ("ok" in result) {
        setMessage(`WASM module for ${shardType} updated successfully.`);
      } else {
        setMessage(`Error updating ${shardType} WASM module: ${result.err}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex space-x-4 mb-4">
          <Button onClick={login}>Login</Button>
          <Button
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            Logout
          </Button>
        </div>
        <CardTitle className="flex items-center text-lg font-semibold">
          <RefreshCw className="mr-2 h-6 w-6" />
          Update {shardType.charAt(0).toUpperCase() + shardType.slice(1)} WASM
          Module
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleUpdateWasmModule} className="space-y-6">
          <div className="flex flex-col space-y-4">
            <div
              className="flex items-center justify-center w-full h-32 p-4 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-gray-400 focus:outline-none"
              onClick={() =>
                document.getElementById(`file-upload-${shardType}`).click()
              }
            >
              <span className="flex items-center space-x-2 text-gray-600">
                <Upload className="w-6 h-6" />
                <span className="font-medium">
                  {wasmFile ? wasmFile.name : "Click to upload WASM file"}
                </span>
              </span>
              <input
                id={`file-upload-${shardType}`}
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
