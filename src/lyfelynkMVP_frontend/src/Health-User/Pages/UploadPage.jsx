import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import FileUpload from "../../Functions/file-upload";
import { DatePicker } from "@/Functions/DatePicker";
import { jsPDF } from "jspdf";
import lighthouse from "@lighthouse-web3/sdk";

import { useState, useContext } from "react";

import LoadingScreen from "../../LoadingScreen";
import * as vetkd from "ic-vetkd-utils";
import ActorContext from "../../ActorContext";
export default function UploadContent() {
  const { actors } = useContext(ActorContext);
  const [formData, setFormData] = useState({
    dateOfCheckup: "",
    typeOfCheckup: "",
    healthcareProvider: "",
    reasonForCheckup: "",
    medicationName: "",
    dosage: "",
    frequency: "",
    prescribingDoctor: "",
  });
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const uploadToLighthouse = async (file) => {
    const progressCallback = (progressData) => {
      let percentageDone =
        100 - (progressData?.total / progressData?.uploaded)?.toFixed(2);
      console.log(`Upload progress: ${percentageDone}%`);
    };

    try {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const fileList = dataTransfer.files;
      console.log(fileList);
      const output = await lighthouse.upload(
        fileList,
        process.env.LIGHTHOUSEAPI,
        null,
        progressCallback
      );
      console.log("File Status:", output);
      console.log(
        "Visit at https://gateway.lighthouse.storage/ipfs/" + output.data.Hash
      );
      return output.data.Hash;
    } catch (error) {
      console.error("Error uploading to Lighthouse:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Upload/link an empty file to get a unique ID
      const emptyDataAsset = {
        assetID: "",
        title: "Empty File",
        description: "Placeholder for encryption",
        data: "[]",
        metadata: {
          category: "",
          tags: [],
          format: "empty",
        },
      };

      const result = await actors.dataAsset.uploadDataAsset(emptyDataAsset);
      let uniqueID = "";

      Object.keys(result).forEach((key) => {
        if (key === "err") {
          throw new Error(result[key]);
        }
        if (key === "ok") {
          uniqueID = result[key];
        }
      });
      console.log(uniqueID);
      console.log("This is unique ID: : " + uniqueID);
      if (!uniqueID) {
        throw new Error("Failed to get unique ID");
      }

      // Step 2: Fetch the encrypted key using encrypted_symmetric_key_for_dataAsset
      const seed = window.crypto.getRandomValues(new Uint8Array(32));
      const tsk = new vetkd.TransportSecretKey(seed);
      const encryptedKeyResult =
        await actors.dataAsset.getEncryptedSymmetricKeyForAsset(
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
      console.log("encrypted key " + encryptedKey);
      if (!encryptedKey) {
        throw new Error("Failed to get encrypted key");
      }

      const pkBytesHex =
        await actors.dataAsset.getSymmetricKeyVerificationKey(uniqueID);

      let symmetricVerificiationKey = "";

      Object.keys(pkBytesHex).forEach((key) => {
        if (key === "err") {
          throw new Error(pkBytesHex[key]);
        }
        if (key === "ok") {
          symmetricVerificiationKey = pkBytesHex[key];
        }
      });
      console.log("symmetric verification key " + symmetricVerificiationKey);
      if (!symmetricVerificiationKey) {
        throw new Error("Failed to get encrypted key");
      }

      const aesGCMKey = tsk.decrypt_and_hash(
        hex_decode(encryptedKey),
        hex_decode(symmetricVerificiationKey),
        new TextEncoder().encode(uniqueID),
        32,
        new TextEncoder().encode("aes-256-gcm")
      );
      console.log(aesGCMKey);

      // Step 3: Encrypt the user's file using the AES-GCM key
      // Generate PDF
      const doc = new jsPDF();
      let pdfContent = "";
      for (const [key, value] of Object.entries(formData)) {
        pdfContent += `${key}: ${value}\n\n`;
      }
      doc.text(pdfContent, 10, 10);

      // Save PDF as a file
      const pdfBlob = doc.output("blob");
      const pdfFile = new File([pdfBlob], "generated.pdf", {
        type: "application/pdf",
      });

      const arrayBuffer = await pdfFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const encryptedData = await aes_gcm_encrypt(uint8Array, aesGCMKey);

      // Step 4: Upload encrypted data to Lighthouse
      const encryptedBlob = new Blob([encryptedData]);
      const encryptedFile = new File([encryptedBlob], "encrypted.bin", {
        type: "application/octet-stream",
      });
      const lighthouseHash = await uploadToLighthouse(encryptedFile);

      const metadata = {
        category: category,
        tags: [keywords],
        format: pdfFile.type,
      };

      const dataAsset = {
        assetID: uniqueID,
        title: pdfFile.name,
        description: description,
        data: lighthouseHash,
        metadata: metadata,
      };

      // Step 5: Update the data asset with the Lighthouse hash
      const updateResult = await actors.dataAsset.updateDataAsset(
        uniqueID,
        dataAsset
      );

      Object.keys(updateResult).forEach((key) => {
        if (key === "err") {
          throw new Error(updateResult[key]);
        }
        if (key === "ok") {
          toast({
            title: "Success",
            description: updateResult[key],
            variant: "success",
          });
        }
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const aes_gcm_encrypt = async (data, rawKey) => {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const aes_key = await window.crypto.subtle.importKey(
      "raw",
      rawKey,
      "AES-GCM",
      false,
      ["encrypt"]
    );
    const ciphertext_buffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      aes_key,
      data
    );
    const ciphertext = new Uint8Array(ciphertext_buffer);
    const iv_and_ciphertext = new Uint8Array(iv.length + ciphertext.length);
    iv_and_ciphertext.set(iv, 0);
    iv_and_ciphertext.set(ciphertext, iv.length);
    return iv_and_ciphertext;
  };
  // const hex_encode = (bytes) =>
  //   bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
  const hex_decode = (hexString) =>
    Uint8Array.from(
      hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
    );

  if (loading) {
    return <LoadingScreen />;
  }
  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center p-8">
        <h1 className="mt-4 text-4xl font-bold">Upload your Health Data</h1>
        <p className="mt-2 text-lg text-gray-600">
          Choose a suitable format to upload your data.
        </p>
        <div className="mt-6 w-full max-w-4xl">
          <Tabs defaultValue="Document">
            <TabsList className="w-full">
              <TabsTrigger
                className="w-1/2"
                value="Document"
              >
                Document
              </TabsTrigger>
              <TabsTrigger
                className="w-1/2"
                value="Form"
              >
                Form
              </TabsTrigger>
            </TabsList>
            <TabsContent value="Document">
              <FileUpload />
            </TabsContent>

            <TabsContent value="Form">
              <p className="text-sm mb-4 text-gray-500">
                Fill the form out carefully and make sure the information is
                true to your knowledge.
              </p>
              <form
                className="space-y-6"
                onSubmit={handleSubmit}
              >
                <div>
                  <h2 className="text-xl font-semibold">
                    Health Checkup Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex flex-col space-y-1.5">
                      <label
                        className="font-medium"
                        htmlFor="date-of-checkup"
                      >
                        Date of Checkup
                      </label>
                      <DatePicker
                        id="date-of-checkup"
                        value={formData.dateOfCheckup}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label
                        className="font-medium"
                        htmlFor="type-of-checkup"
                      >
                        Type of Checkup
                      </label>
                      <Select
                        id="type-of-checkup"
                        value={formData.typeOfCheckup}
                        onValueChange={(value) =>
                          handleSelectChange("typeOfCheckup", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="general">
                            General Checkup
                          </SelectItem>
                          <SelectItem value="blood-test">Blood Test</SelectItem>
                          <SelectItem value="cholesterol">
                            Cholesterol Test
                          </SelectItem>
                          <SelectItem value="cardiac">
                            Cardiac Evaluation
                          </SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label
                        className="font-medium"
                        htmlFor="healthcare-provider"
                      >
                        Healthcare Provider/Facility Name
                      </label>
                      <Input
                        id="healthcareProvider"
                        placeholder="Enter name"
                        value={formData.healthcareProvider}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label
                        className="font-medium"
                        htmlFor="reason-for-checkup"
                      >
                        Reason for Checkup
                      </label>
                      <Select
                        id="reason-for-checkup"
                        value={formData.reasonForCheckup}
                        onValueChange={(value) =>
                          handleSelectChange("reasonForCheckup", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="routine">Routine</SelectItem>
                          <SelectItem value="symptoms">
                            Specific Symptoms
                          </SelectItem>
                          <SelectItem value="pre-surgery">
                            Pre-Surgery
                          </SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    Prescription Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex flex-col space-y-1.5">
                      <label
                        className="font-medium"
                        htmlFor="medication-name"
                      >
                        Medication Name(s)
                      </label>
                      <Input
                        id="medicationName"
                        placeholder="Enter medication name"
                        value={formData.medicationName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label
                        className="font-medium"
                        htmlFor="dosage"
                      >
                        Dosage
                      </label>
                      <Input
                        id="dosage"
                        placeholder="Enter dosage"
                        value={formData.dosage}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label
                        className="font-medium"
                        htmlFor="frequency"
                      >
                        Frequency
                      </label>
                      <Input
                        id="frequency"
                        placeholder="Enter frequency"
                        value={formData.frequency}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label
                        className="font-medium"
                        htmlFor="prescribing-doctor"
                      >
                        Prescribing Doctor
                      </label>
                      <Input
                        id="prescribingDoctor"
                        placeholder="Enter doctor's name"
                        value={formData.prescribingDoctor}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Keywords</TableHead>
                        <TableHead>Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>{"Report Generated"}</TableCell>
                        <TableCell>
                          <div className="border rounded-sm">
                            <Textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="border rounded-sm">
                            <Textarea
                              type="text"
                              className="py-3"
                              value={keywords}
                              onChange={(e) => setKeywords(e.target.value)}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="border rounded-sm">
                            <Textarea
                              type="text"
                              className="py-3"
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <Button type="submit">Submit</Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
