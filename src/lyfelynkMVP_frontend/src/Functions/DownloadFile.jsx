import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ActorContext from "../ActorContext";
import * as vetkd from "ic-vetkd-utils";

import { useState } from "react";

const DownloadFile = ({ uniqueID, format, title }) => {
  const { actors } = useContext(ActorContext);
  const [downloading, setDownloading] = useState(false);

  function downloadData(file) {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  const hex_decode = (hexString) =>
    Uint8Array.from(
      hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
    );

  const aes_gcm_decrypt = async (encryptedData, rawKey) => {
    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);
    const aes_key = await window.crypto.subtle.importKey(
      "raw",
      rawKey,
      "AES-GCM",
      false,
      ["decrypt"]
    );
    const decrypted_buffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      aes_key,
      ciphertext
    );
    return new Uint8Array(decrypted_buffer);
  };

  const downloadFile = async () => {
    try {
      setDownloading(true);

      // Step 1: Retrieve the encrypted key using encrypted_symmetric_key_for_dataAsset
      const seed = window.crypto.getRandomValues(new Uint8Array(32));
      const tsk = new vetkd.TransportSecretKey(seed);
      const encryptedKeyResult =
        await actors.DataAsset.encrypted_symmetric_key_for_dataAsset(
          uniqueID,
          Object.values(tsk.public_key())
        );

      let encryptedKey = "";

      Object.keys(encryptedKeyResult).forEach((key) => {
        if (key === "err") {
          throw new Error(encryptedKeyResult[key]);
        }
        if (key === "ok") {
          encryptedKey = encryptedKeyResult[key];
        }
      });

      if (!encryptedKey) {
        throw new Error("Failed to retrieve the encrypted key.");
      }

      const pkBytesHex =
        await actors.DataAsset.symmetric_key_verification_key();
      const aesGCMKey = tsk.decrypt_and_hash(
        hex_decode(encryptedKey),
        hex_decode(pkBytesHex),
        new TextEncoder().encode(uniqueID),
        32,
        new TextEncoder().encode("aes-256-gcm")
      );
      console.log(aesGCMKey);
      // Step 2: Decrypt the data using the AES-GCM key
      const result = await actors.DataAsset.downloadDataAssetData(uniqueID);
      const decryptedData = await aes_gcm_decrypt(
        new Uint8Array(result.ok),
        aesGCMKey
      );

      // Step 3: Create a Blob and File from the decrypted data
      const decryptedFileBlob = new Blob([decryptedData], {
        type: format,
      });
      const decryptedFile = new File([decryptedFileBlob], title, {
        type: format,
      });

      // Step 4: Download the decrypted file
      downloadData(decryptedFile);
      setDownloading(false);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download the file. Please try again.");
    }
  };

  return (
    <Button
      className="p-2 text-white"
      onClick={downloadFile}
      disabled={downloading}
    >
      <Download />
    </Button>
  );
};

export default DownloadFile;
