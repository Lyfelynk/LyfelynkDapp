import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoadingScreen from "../../LoadingScreen";
import OnboardingBanner from "../../OnboardingBanner";
import { Link, useNavigate } from "react-router-dom";
import { isValidNumber } from "aadhaar-validator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import ActorContext from "../../ActorContext";
import * as vetkd from "ic-vetkd-utils";
import { toast } from "@/components/ui/use-toast";

export default function RegisterPage4Content() {
  const [step, setStep] = useState(1);
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [txnId, setTxnId] = useState("");
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [healthIdData, setHealthIdData] = useState(null);
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const { actors } = useContext(ActorContext);
  const navigate = useNavigate();

  const generateRandomUsername = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomStr = "";
    for (let i = 0; i < 10; i++) {
      randomStr += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return `user${randomStr}`;
  };

  useEffect(() => {
    const randomUsername = generateRandomUsername();
    setUsername(randomUsername);
  }, []);

  const steps = [
    { id: "1", name: "Generate Aadhaar OTP" },
    { id: "2", name: "Create Health ID" },
  ];

  const registerUser = async () => {
    setLoading(true);
    try {
      const { name, gender } = healthIdData;
      const dob = `${healthIdData.yearOfBirth}-${healthIdData.monthOfBirth}-${healthIdData.dayOfBirth}`;
      const state = healthIdData.stateName;
      const country = "India";
      const heartRate = 0; // Default value or modify as needed
      const demoInfo = { name, dob, gender, country, state, pincode };
      const basicHealthPara = { bloodType, height, heartRate, weight };

      // Convert to JSON strings
      const demoInfoJson = JSON.stringify(demoInfo);
      const basicHealthParaJson = JSON.stringify(basicHealthPara);

      // Convert JSON strings to Uint8Array
      const demoInfoArray = new TextEncoder().encode(demoInfoJson);
      const basicHealthParaArray = new TextEncoder().encode(
        basicHealthParaJson,
      );

      // Step 2: Fetch the encrypted key using encrypted_symmetric_key_for_dataAsset
      const seed = window.crypto.getRandomValues(new Uint8Array(32));
      const tsk = new vetkd.TransportSecretKey(seed);
      const encryptedKeyResult =
        await actors.user.encrypted_symmetric_key_for_user(
          Object.values(tsk.public_key()),
        );

      let encryptedKey = "";

      Object.keys(encryptedKeyResult).forEach((key) => {
        if (key === "err") {
          toast({
            title: "Error",
            description: encryptedKeyResult[key],
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        if (key === "ok") {
          encryptedKey = encryptedKeyResult[key];
        }
      });

      if (!encryptedKey) {
        setLoading(false);
        return;
      }

      const pkBytesHex = await actors.user.symmetric_key_verification_key();
      const principal = await actors.user.whoami();
      console.log(pkBytesHex);
      console.log(encryptedKey);
      const aesGCMKey = tsk.decrypt_and_hash(
        hex_decode(encryptedKey),
        hex_decode(pkBytesHex),
        new TextEncoder().encode(principal),
        32,
        new TextEncoder().encode("aes-256-gcm"),
      );
      console.log(aesGCMKey);

      const encryptedDataDemo = await aes_gcm_encrypt(demoInfoArray, aesGCMKey);
      const encryptedDataBasicHealth = await aes_gcm_encrypt(
        basicHealthParaArray,
        aesGCMKey,
      );
      const result = await actors.user.createUser(
        Object.values(encryptedDataDemo),
        Object.values(encryptedDataBasicHealth),
        [],
        [],
      );
      console.log(result);
      Object.keys(result).forEach((key) => {
        if (key == "err") {
          toast({
            title: "Error",
            description: result[key],
            variant: "destructive",
          });
          setLoading(false);
        }
        if (key == "ok") {
          toast({
            title: "Success",
            description: "User ID No. :" + result[key],
            variant: "success",
          });
          setLoading(false);
          navigate("verify");
        }
      });
    } catch (error) {
      console.error("An unexpected error occurred:", error);

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
      ["encrypt"],
    );
    const ciphertext_buffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      aes_key,
      data,
    );
    const ciphertext = new Uint8Array(ciphertext_buffer);
    const iv_and_ciphertext = new Uint8Array(iv.length + ciphertext.length);
    iv_and_ciphertext.set(iv, 0);
    iv_and_ciphertext.set(ciphertext, iv.length);
    return iv_and_ciphertext;
  };

  const hex_decode = (hexString) =>
    Uint8Array.from(
      hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)),
    );

  const generateOtp = async () => {
    setLoading(true);
    if (!isValidNumber(aadhaar)) {
      setMessage("Invalid Aadhaar number");
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post(
        "https://squid-app-ehrho.ondigitalocean.app/generate-otp",
        { aadhaar },
      );
      setTxnId(response.data.txnId);
      setMessage("Aadhaar OTP sent. Please check your phone.");
      setStep(2);
    } catch (error) {
      setMessage("Failed to generate Aadhaar OTP: " + error.response.message);
    } finally {
      setLoading(false);
    }
  };

  const createHealthId = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "https://squid-app-ehrho.ondigitalocean.app/create-health-id",
        { otp, txnId, username, mobile },
      );
      setHealthIdData(response.data.healthIdData);
      setMessage("Health ID created successfully!");
      const district = response.data.healthIdData.districtName;
      const pincodeResponse = await axios.get(
        `https://api.postalpincode.in/postoffice/${district}`,
      );
      if (pincodeResponse.data[0].PostOffice.length > 0) {
        setPincode(pincodeResponse.data[0].PostOffice[0].Pincode);
      } else {
        setMessage("No pincode found for the specified district.");
      }

      // Call registerUser after creating health ID
    } catch (error) {
      if (error.response && error.response.data) {
        const response = error.response.data;
        let serverMessage = response.message || "An error occurred";

        if (response.details && response.details.length > 0) {
          serverMessage = response.details[0].message;
        }
        setMessage(`Failed to Create Health ID: ${serverMessage}`);
      } else {
        setMessage("Failed to Create Health ID: An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <section className="bg-[conic-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-blue-700 via-blue-800 to-gray-900">
      <OnboardingBanner />
      <div className="px-6 flex justify-center items-center h-screen">
        <div className="flex flex-col lg:flex-row md:w-5/6">
          <div className="flex-1 flex flex-col justify-center text-white p-4">
            <div className="flex items-center mb-4">
              <img
                alt="Logo"
                className="h-10 w-48"
                src="/assets/lyfelynk.png"
              />
            </div>
            <p className="text-xl md:text-2xl">
              Digitally Linking your health.
            </p>
          </div>

          <div className="flex-1 items-center max-w-xl bg-background rounded-lg p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl md:text-2xl font-bold">
                Create ID with ABHA
              </h2>
              <Link to="/Register">
                <ChevronLeft />
              </Link>
            </div>

            <nav aria-label="Progress">
              <ol
                role="list"
                className="space-y-4 md:flex md:space-x-8 md:space-y-0"
              >
                {steps.map((stepItem, index) => (
                  <li key={stepItem.name} className="md:flex-1">
                    <div className="relative flex items-center">
                      {step > index + 1 ? (
                        <div className="group flex w-full flex-col border-l-4 border-blue-600 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                          <span className="text-sm font-bold text-blue-600 transition-colors">
                            Step {stepItem.id}
                          </span>
                          <span className="text-sm font-medium text-blue-600 transition-colors min-w-fit">
                            {stepItem.name}
                          </span>
                        </div>
                      ) : step === index + 1 ? (
                        <div
                          className="flex w-full flex-col border-l-4 border-blue-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                          aria-current="step"
                        >
                          <span className="text-sm font-bold text-blue-600 transition-colors">
                            Step {stepItem.id}
                          </span>
                          <span className="text-sm font-medium text-blue-600 min-w-fit ">
                            {stepItem.name}
                          </span>
                        </div>
                      ) : (
                        <div className="group flex w-full flex-col border-l-4 border-gray-200 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                          <span className="text-sm font-bold text-gray-500 transition-colors">
                            Step {stepItem.id}
                          </span>
                          <span className="text-sm font-medium text-gray-500 transition-colors">
                            {stepItem.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="mt-4 space-y-4">
              {step === 1 && (
                <div className="flex flex-col space-y-2">
                  <Input
                    id="aadhaar"
                    type="text"
                    placeholder="Aadhaar"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                  />
                  <Button onClick={generateOtp} className="w-full">
                    Generate Aadhaar OTP
                  </Button>
                </div>
              )}

              {step === 2 &&
                !healthIdData && ( // Check if healthIdData is not available
                  <div className="flex flex-col space-y-2">
                    <div>
                      <label
                        className="block text-sm font-medium leading-5 text-foreground"
                        htmlFor="mobile"
                      >
                        Mobile
                      </label>
                      <div className="mt-1">
                        <Input
                          id="mobile"
                          type="text"
                          placeholder="Mobile"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium leading-5 text-foreground"
                        htmlFor="otp"
                      >
                        Otp
                      </label>
                      <div className="mt-1">
                        <Input
                          id="otp"
                          type="text"
                          placeholder="OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium leading-5 text-foreground"
                        htmlFor="blood_type"
                      >
                        Blood Type
                      </label>
                      <div className="mt-1">
                        <Select
                          value={bloodType}
                          onValueChange={(value) => setBloodType(value)} // Update state on selection
                        >
                          <SelectTrigger id="blood_type">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="a+">A+</SelectItem>
                            <SelectItem value="a-">A-</SelectItem>
                            <SelectItem value="b+">B+</SelectItem>
                            <SelectItem value="b-">B-</SelectItem>
                            <SelectItem value="ab+">AB+</SelectItem>
                            <SelectItem value="ab-">AB-</SelectItem>
                            <SelectItem value="o+">O+</SelectItem>
                            <SelectItem value="o-">O-</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium leading-5 text-foreground"
                        htmlFor="height"
                      >
                        Height
                      </label>
                      <div className="mt-1">
                        <Input
                          id="height"
                          type="number"
                          inputMode="decimal"
                          placeholder="Height in cm"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium leading-5 text-foreground"
                        htmlFor="weight"
                      >
                        Weight
                      </label>
                      <div className="mt-1">
                        <Input
                          id="weight"
                          type="number"
                          inputMode="decimal"
                          placeholder="Weight in Kg"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button onClick={createHealthId} className="w-full">
                      Create ABHA ID
                    </Button>
                  </div>
                )}

              {healthIdData && (
                <>
                  <h3 className="text-lg font-bold">Health ID Details:</h3>
                  <div className="text-white flex gap-x-4">
                    <div className="w-full ">
                      <div>
                        <span className="font-bold">Name:</span>{" "}
                        <span>
                          {healthIdData.firstName} {healthIdData.middleName}{" "}
                          {healthIdData.lastName}
                        </span>
                      </div>
                      <div>
                        <div>
                          <span className="font-bold">Date of Birth:</span>{" "}
                          <span>
                            {healthIdData.dayOfBirth}/
                            {healthIdData.monthOfBirth}/
                            {healthIdData.yearOfBirth}
                          </span>
                        </div>
                        <span className="font-bold">Gender:</span>
                        <span>{healthIdData.gender}</span>
                      </div>
                      <div>
                        <span className="font-bold">City:</span>
                        <span>{healthIdData.districtName}</span>
                      </div>
                    </div>
                    <div className="w-full  ">
                      <div>
                        <span className="font-bold">State:</span>{" "}
                        <span>{healthIdData.stateName}</span>
                      </div>
                      <div>
                        <span className="font-bold">Country:</span>{" "}
                        <span>India</span>
                      </div>
                      <div>
                        <span className="font-bold">Pincode:</span>{" "}
                        <span>{pincode}</span>
                      </div>
                      <div>
                        <span className="font-bold">Health ID:</span>{" "}
                        <span>{healthIdData.healthId}</span>
                      </div>
                    </div>
                  </div>
                  <Button onClick={registerUser} className="w-full">
                    Create User Health ID
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
