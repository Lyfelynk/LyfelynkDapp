import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCanister } from "@connect2ic/react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChevronLeft } from "lucide-react";
import LoadingScreen from "../../LoadingScreen";
import OnboardingBanner from "../../OnboardingBanner";

import * as vetkd from "ic-vetkd-utils";

export default function RegisterPage1Content() {
  const navigate = useNavigate();

  const [lyfelynkMVP_backend] = useCanister("lyfelynkMVP_backend");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [height, setHeight] = useState("");
  const [country, setCountry] = useState("");
  const [weight, setWeight] = useState("");
  const [state, setState] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);

  const registerUser = async () => {
    setLoading(true);
    const demoInfo = {
      name,
      dob,
      gender,
      country,
      state,
      pincode,
    };

    const basicHealthPara = {
      bloodType,
      height,
      heartRate,
      weight,
    };
    // Convert demoInfo and basicHealthPara objects to JSON strings
    const demoInfoJson = JSON.stringify(demoInfo);
    const basicHealthParaJson = JSON.stringify(basicHealthPara);

    // Convert JSON strings to Uint8Array
    const demoInfoArray = new TextEncoder().encode(demoInfoJson);
    const basicHealthParaArray = new TextEncoder().encode(basicHealthParaJson);
    // Step 2: Fetch the encrypted key using encrypted_symmetric_key_for_dataAsset
    const seed = window.crypto.getRandomValues(new Uint8Array(32));
    const tsk = new vetkd.TransportSecretKey(seed);
    const encryptedKeyResult =
      await lyfelynkMVP_backend.encrypted_symmetric_key_for_user(
        Object.values(tsk.public_key()),
      );

    let encryptedKey = "";

    Object.keys(encryptedKeyResult).forEach((key) => {
      if (key === "err") {
        alert(encryptedKeyResult[key]);
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

    const pkBytesHex =
      await lyfelynkMVP_backend.symmetric_key_verification_key();
    const principal = await lyfelynkMVP_backend.whoami();
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
    const result = await lyfelynkMVP_backend.createUser(
      Object.values(encryptedDataDemo),
      Object.values(encryptedDataBasicHealth),
      [],
      [],
    );
    Object.keys(result).forEach((key) => {
      if (key == "err") {
        //alert(result[key]);
        toast({
          title: "Error",
          description: result[key],
          variant: "destructive",
        });
        setLoading(false);
      }
      if (key == "ok") {
        //alert("User ID No. :" + result[key]);
        toast({
          title: "Success",
          description: "User ID No. :" + result[key],
          variant: "success",
        });
        setLoading(false);
        navigate("verify");
      }
    });
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
  // const hex_encode = (bytes) =>
  //   bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
  const hex_decode = (hexString) =>
    Uint8Array.from(
      hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)),
    );

  if (loading) {
    return <LoadingScreen />;
  }
  return (
    <section className="bg-[conic-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-blue-700 via-blue-800 to-gray-900">
      <OnboardingBanner />
      <div className="px-6 flex justify-center items-center h-screen">
        <div className="flex flex-col lg:flex-row md:w-4/6">
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
              <h2 className="text-xl md:text-2xl font-bold">Register User</h2>
              <Link to="/Register">
                <ChevronLeft />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="name"
                >
                  Name
                </label>
                <div className="mt-1">
                  <Input
                    id="name"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="dob"
                >
                  Date of Birth
                </label>
                <div className="mt-1">
                  <Input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="gender"
                >
                  Gender
                </label>
                <div className="mt-1">
                  <Select
                    value={gender}
                    onValueChange={(value) => setGender(value)}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                    onValueChange={(value) => setBloodType(value)}
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
                    placeholder="Height in cm"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="country"
                >
                  Country
                </label>
                <div className="mt-1">
                  <Input
                    id="country"
                    placeholder="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
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
                    placeholder="Weight in Kg"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="state"
                >
                  State
                </label>
                <div className="mt-1">
                  <Input
                    id="state"
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="heartRate"
                >
                  Heart Rate
                </label>
                <div className="mt-1">
                  <Input
                    id="heartRate"
                    placeholder="Heart Rate"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="pincode"
                >
                  Pincode
                </label>
                <div className="mt-1">
                  <Input
                    id="pincode"
                    placeholder="Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={registerUser}>
              Submit
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
