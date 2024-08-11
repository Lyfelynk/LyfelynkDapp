import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";

import ActorContext from "./ActorContext";

function AdminDashboard() {
  const { actors, isAuthenticated, login } = useContext(ActorContext);
  const [message, setMessage] = useState("");
  const [wasmFile, setWasmFile] = useState(null);
  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  function handleWasmFileChange(event) {
    setWasmFile(event.target.files[0]);
  }

  async function handleUpdateWasmModule(event) {
    event.preventDefault();
    if (!wasmFile) {
      setMessage("Please select a WASM file first.");
      return;
    }

    try {
      const arrayBuffer = await readFile(wasmFile);
      const byteArray = [...new Uint8Array(arrayBuffer)];

      const result = await actors.user.updateUserShardWasmModule(byteArray);
      if ("ok" in result) {
        setMessage("WASM module updated successfully.");
      } else {
        setMessage(`Error: ${result.err}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  }

  return (
    <div>
      <Button onClick={login}>Login</Button>
      <h1>LyfeLynk Admin Management</h1>
      <form onSubmit={handleUpdateWasmModule}>
        <h2>Update WASM Module</h2>
        <input
          type="file"
          accept=".wasm"
          onChange={handleWasmFileChange}
        />
        <button type="submit">Update WASM Module</button>
      </form>
      <div>
        <h2>Message:</h2>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default AdminDashboard;
