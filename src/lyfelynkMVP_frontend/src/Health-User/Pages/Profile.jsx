import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ActorContext from "../../ActorContext";
import { useState, useEffect, useContext } from "react";
import LoadingScreen from "../../LoadingScreen";
import * as vetkd from "ic-vetkd-utils";
import { toast } from "@/components/ui/use-toast";

export default function ProfileContent() {
  const { actors } = useContext(ActorContext);

  const [userData, setUserData] = useState(null);
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
  const hex_decode = (hexString) =>
    Uint8Array.from(
      hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
    );
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const result = await actors.user.readUser();
        if (result.ok) {
          const { IDNum, UUID, MetaData } = result.ok;
          const {
            DemographicInformation,
            BasicHealthParameters,
            BiometricData,
            FamilyInformation,
          } = MetaData;
          // Step 1: Retrieve the encrypted key using encrypted_symmetric_key_for_dataAsset

          const seed = window.crypto.getRandomValues(new Uint8Array(32));
          const tsk = new vetkd.TransportSecretKey(seed);
          const encryptedKeyResult =
            await actors.user.encrypted_symmetric_key_for_user(
              Object.values(tsk.public_key())
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

          const pkBytesHex = await actors.user.symmetric_key_verification_key();
          const principal = await actors.user.whoami();
          console.log(pkBytesHex);
          console.log(encryptedKey);
          const aesGCMKey = tsk.decrypt_and_hash(
            hex_decode(encryptedKey),
            hex_decode(pkBytesHex),
            new TextEncoder().encode(principal),
            32,
            new TextEncoder().encode("aes-256-gcm")
          );
          console.log(aesGCMKey);
          console.log(typeof DemographicInformation);
          console.log(typeof BasicHealthParameters);
          console.log(DemographicInformation);
          console.log(BasicHealthParameters);
          const decryptedDataDemo = await aes_gcm_decrypt(
            new Uint8Array(DemographicInformation),
            aesGCMKey
          );
          const decryptedDataBasicHealth = await aes_gcm_decrypt(
            new Uint8Array(BasicHealthParameters),
            aesGCMKey
          );

          const parsedDemographicInfo = JSON.parse(
            String.fromCharCode.apply(null, decryptedDataDemo)
          );
          const parsedBasicHealthParams = JSON.parse(
            String.fromCharCode.apply(null, decryptedDataBasicHealth)
          );
          const parsedBiometricData =
            BiometricData.length > 0
              ? JSON.parse(String.fromCharCode.apply(null, BiometricData))
              : null;
          const parsedFamilyInfo =
            FamilyInformation.length > 0
              ? JSON.parse(String.fromCharCode.apply(null, FamilyInformation))
              : null;

          setUserData({
            IDNum,
            UUID,
            DemographicInformation: parsedDemographicInfo,
            BasicHealthParameters: parsedBasicHealthParams,
            BiometricData: parsedBiometricData,
            FamilyInformation: parsedFamilyInfo,
          });
        } else {
          alert(result.err);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [actors.user]);

  useEffect(() => {
    if (userData) {
      setName(userData.DemographicInformation.name || "");
      setDob(userData.DemographicInformation.dob || "");
      setGender(userData.DemographicInformation.gender || "");
      setBloodType(userData.BasicHealthParameters.bloodType || "");
      setHeight(userData.BasicHealthParameters.height || "");
      setCountry(userData.DemographicInformation.country || "");
      setWeight(userData.BasicHealthParameters.weight || "");
      setState(userData.DemographicInformation.state || "");
      setHeartRate(userData.BasicHealthParameters.heartRate || "");
      setPincode(userData.DemographicInformation.pincode || "");
    }
  }, [userData]);

  const handleUpdateUser = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
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
      const basicHealthParaArray = new TextEncoder().encode(
        basicHealthParaJson
      );

      // Step 2: Fetch the encrypted key using encrypted_symmetric_key_for_dataAsset
      const seed = window.crypto.getRandomValues(new Uint8Array(32));
      const tsk = new vetkd.TransportSecretKey(seed);
      const encryptedKeyResult =
        await actors.user.encrypted_symmetric_key_for_user(
          Object.values(tsk.public_key())
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

      const pkBytesHex = await actors.user.symmetric_key_verification_key();
      const principal = await actors.user.whoami();
      console.log(pkBytesHex);
      console.log(encryptedKey);
      const aesGCMKey = tsk.decrypt_and_hash(
        hex_decode(encryptedKey),
        hex_decode(pkBytesHex),
        new TextEncoder().encode(principal),
        32,
        new TextEncoder().encode("aes-256-gcm")
      );
      console.log(aesGCMKey);

      const encryptedDataDemo = await aes_gcm_encrypt(demoInfoArray, aesGCMKey);
      const encryptedDataBasicHealth = await aes_gcm_encrypt(
        basicHealthParaArray,
        aesGCMKey
      );
      const result = await actors.user.updateUser(
        Object.values(encryptedDataDemo),
        Object.values(encryptedDataBasicHealth),
        [],
        []
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
          //alert(result[key]);
          toast({
            title: "Success",
            description: result[key],
            variant: "success",
          });
          setLoading(false);
        }
      });
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };
  if (loading) {
    return <LoadingScreen />;
  }
  if (!userData) {
    return <LoadingScreen />;
  }
  return (
    <div>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto">
          <h1 className="text-center text-4xl font-bold leading-9 ">
            Update Profile
          </h1>
          <p className="mt-2 text-center text-sm leading-5 text-gray-600">
            Update your Profile Information
          </p>
          <form
            className="mt-8"
            onSubmit={handleUpdateUser}
          >
            <div className="rounded-md shadow-sm">
              <div className="flex flex-col items-center">
                <Avatar className="-z-10 w-36 h-36">
                  <AvatarImage
                    alt="John Lenon"
                    src=""
                  />
                  <AvatarFallback className="text-4xl">JL</AvatarFallback>
                </Avatar>

                <div className="flex space-x-2 py-4">
                  <p>ID Number:- {userData.IDNum}</p>
                  <p>UUID:- {userData.UUID}</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-y-6 gap-x-4 ">
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
                      disabled
                      className="border"
                      id="dob"
                      placeholder="mm/dd/yyyy"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
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
                      onValueChange={setGender}
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
                      onValueChange={setBloodType}
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
            </div>
            <div className="mt-6">
              <Button
                className="w-full"
                type="submit"
              >
                Update
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
