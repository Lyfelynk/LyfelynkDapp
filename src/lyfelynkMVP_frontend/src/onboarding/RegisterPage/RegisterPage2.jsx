import React, { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import LoadingScreen from "../../LoadingScreen";
import OnboardingBanner from "../../OnboardingBanner";
// import * as vetkd from "ic-vetkd-utils";
import { z } from "zod";
import ActorContext from "../../ActorContext";

// Define the Zod schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dob: z.string().min(1, "Date of Birth is required"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Gender is required",
  }),
  bloodType: z.string().optional(),
  height: z
    .string()
    .regex(/^\d*\.?\d*$/, "Height must be a number")
    .optional(),
  country: z.string().optional(),
  weight: z
    .string()
    .regex(/^\d*\.?\d*$/, "Weight must be a number")
    .optional(),
  state: z.string().optional(),
  heartRate: z
    .string()
    .regex(/^\d*$/, "Heart rate must be a whole number")
    .optional(),
  pincode: z.string().min(1, "Pincode is required"),
  occupation: z.string().optional(),
  certificationId: z.string().optional(),
  company: z.string().optional(),
});

export default function RegisterPage2Content() {
  const { actors } = useContext(ActorContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    gender: "",
    bloodType: "",
    height: "",
    country: "",
    weight: "",
    state: "",
    heartRate: "",
    pincode: "",
    occupation: "",
    certificationId: "",
    company: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleNumericInputChange = (e) => {
    const { id, value } = e.target;
    const regex = id === "heartRate" ? /^\d*$/ : /^\d*\.?\d*$/;
    if (regex.test(value) || value === "") {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const registerProfessional = async () => {
    try {
      // Validate the form data
      formSchema.parse(formData);
      setErrors({});

      setLoading(true);
      const {
        name,
        dob,
        gender,
        bloodType,
        height,
        country,
        weight,
        state,
        heartRate,
        pincode,
      } = formData;
      const { occupation, company, certificationId } = formData;

      const demoInfo = {
        name,
        dob,
        gender,
        bloodType,
        height,
        country,
        weight,
        state,
        heartRate,
        pincode,
      };
      const occupationInfo = { occupation, company };
      const certificationInfo = { certificationId };

      // Convert to JSON strings
      const demoInfoJson = JSON.stringify(demoInfo);
      const occupationInfoJson = JSON.stringify(occupationInfo);
      const certificationInfoJson = JSON.stringify(certificationInfo);

      // Convert JSON strings to Uint8Array
      const demoInfoArray = new TextEncoder().encode(demoInfoJson);
      const occupationInfoArray = new TextEncoder().encode(occupationInfoJson);
      const certificationInfoArray = new TextEncoder().encode(
        certificationInfoJson,
      );

      // // Fetch the encrypted key
      // const seed = window.crypto.getRandomValues(new Uint8Array(32));
      // const tsk = new vetkd.TransportSecretKey(seed);
      // const encryptedKeyResult =
      //   await actors.professional.encrypted_symmetric_key_for_professional(
      //     Object.values(tsk.public_key())
      //   );

      // let encryptedKey = "";

      // Object.keys(encryptedKeyResult).forEach((key) => {
      //   if (key === "err") {
      //     toast({
      //       title: "Error",
      //       description: encryptedKeyResult[key],
      //       variant: "destructive",
      //     });
      //     setLoading(false);
      //     return;
      //   }
      //   if (key === "ok") {
      //     encryptedKey = encryptedKeyResult[key];
      //   }
      // });

      // if (!encryptedKey) {
      //   setLoading(false);
      //   return;
      // }

      // const pkBytesHex =
      //   await actors.professional.symmetric_key_verification_key();
      // const principal = await actors.professional.whoami();
      // const aesGCMKey = tsk.decrypt_and_hash(
      //   hex_decode(encryptedKey),
      //   hex_decode(pkBytesHex),
      //   new TextEncoder().encode(principal),
      //   32,
      //   new TextEncoder().encode("aes-256-gcm")
      // );

      // const encryptedDataDemo = await aes_gcm_encrypt(demoInfoArray, aesGCMKey);
      // const encryptedDataOccupation = await aes_gcm_encrypt(
      //   occupationInfoArray,
      //   aesGCMKey
      // );
      // const encryptedDataCertification = await aes_gcm_encrypt(
      //   certificationInfoArray,
      //   aesGCMKey
      // );

      const result = await actors.professional.createProfessionalRequest(
        demoInfoArray,
        occupationInfoArray,
        certificationInfoArray,
      );

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
            description: result[key],
            variant: "success",
          });
          setLoading(false);
          navigate("verify");
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMap = {};
        error.errors.forEach((err) => {
          errorMap[err.path[0]] = err.message;
        });
        setErrors(errorMap);
      } else {
        console.error("An unexpected error occurred:", error);
      }
      setLoading(false);
    }
  };

  // const aes_gcm_encrypt = async (data, rawKey) => {
  //   const iv = window.crypto.getRandomValues(new Uint8Array(12));
  //   const aes_key = await window.crypto.subtle.importKey(
  //     "raw",
  //     rawKey,
  //     "AES-GCM",
  //     false,
  //     ["encrypt"],
  //   );
  //   const ciphertext_buffer = await window.crypto.subtle.encrypt(
  //     { name: "AES-GCM", iv: iv },
  //     aes_key,
  //     data,
  //   );
  //   const ciphertext = new Uint8Array(ciphertext_buffer);
  //   const iv_and_ciphertext = new Uint8Array(iv.length + ciphertext.length);
  //   iv_and_ciphertext.set(iv, 0);
  //   iv_and_ciphertext.set(ciphertext, iv.length);
  //   return iv_and_ciphertext;
  // };

  // const hex_decode = (hexString) =>
  //   Uint8Array.from(
  //     hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)),
  //   );

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
              <h2 className="text-xl md:text-2xl font-bold">
                Register Professional
              </h2>
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
                  Name *
                </label>
                <div className="mt-1">
                  <Input
                    id="name"
                    placeholder="Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="dob"
                >
                  Date of Birth *
                </label>
                <div className="mt-1">
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.dob && (
                    <p className="text-red-500 text-xs mt-1">{errors.dob}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="gender"
                >
                  Gender *
                </label>
                <div className="mt-1">
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      handleSelectChange("gender", value)
                    }
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
                  {errors.gender && (
                    <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
                  )}
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
                    value={formData.bloodType}
                    onValueChange={(value) =>
                      handleSelectChange("bloodType", value)
                    }
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
                    type="text"
                    inputMode="decimal"
                    placeholder="Height in cm"
                    value={formData.height}
                    onChange={handleNumericInputChange}
                  />
                  {errors.height && (
                    <p className="text-red-500 text-xs mt-1">{errors.height}</p>
                  )}
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
                    value={formData.country}
                    onChange={handleInputChange}
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
                    type="text"
                    inputMode="decimal"
                    placeholder="Weight in Kg"
                    value={formData.weight}
                    onChange={handleNumericInputChange}
                  />
                  {errors.weight && (
                    <p className="text-red-500 text-xs mt-1">{errors.weight}</p>
                  )}
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
                    value={formData.state}
                    onChange={handleInputChange}
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
                    type="text"
                    inputMode="numeric"
                    placeholder="Heart Rate"
                    value={formData.heartRate}
                    onChange={handleNumericInputChange}
                  />
                  {errors.heartRate && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.heartRate}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="pincode"
                >
                  Pincode *
                </label>
                <div className="mt-1">
                  <Input
                    id="pincode"
                    placeholder="Pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.pincode && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.pincode}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="occupation"
                >
                  Occupation
                </label>
                <div className="mt-1">
                  <Input
                    id="occupation"
                    placeholder="Occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="certificationId"
                >
                  Certification Id
                </label>
                <div className="mt-1">
                  <Input
                    id="certificationId"
                    placeholder="Certification Id"
                    value={formData.certificationId}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="company"
                >
                  Company
                </label>
                <div className="mt-1">
                  <Input
                    id="company"
                    placeholder="Company"
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={registerProfessional}>
              Submit
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
