import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ActorContext from "../../ActorContext";
import LoadingScreen from "../../LoadingScreen";
import OnboardingBanner from "../../OnboardingBanner";
import * as vetkd from "ic-vetkd-utils";
import { z } from "zod";

// Define the Zod schema
const formSchema = z.object({
  facultyName: z.string().min(1, "Faculty Name is required"),
  registrationId: z.string().min(1, "Registration ID is required"),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().min(1, "Pincode is required"),
  serviceName: z.string().min(1, "Service Name is required"),
  serviceDesc: z.string().optional(),
});

export default function RegisterPage3Content() {
  const { actors } = useContext(ActorContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    facultyName: "",
    registrationId: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    serviceName: "",
    serviceDesc: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const registerService = async () => {
    try {
      // Validate the form data
      formSchema.parse(formData);
      setErrors({});

      setLoading(true);
      const {
        facultyName,
        registrationId,
        country,
        state,
        city,
        pincode,
        serviceName,
        serviceDesc,
      } = formData;

      const demoInfo = { facultyName, country, state, city, pincode };
      const servicesOfferedInfo = { serviceName, serviceDesc };
      const licenseInfo = { registrationId };

      // Convert to JSON strings
      const demoInfoJson = JSON.stringify(demoInfo);
      const servicesOfferedInfoJson = JSON.stringify(servicesOfferedInfo);
      const licenseInfoJson = JSON.stringify(licenseInfo);

      // Convert JSON strings to Uint8Array
      const demoInfoArray = new TextEncoder().encode(demoInfoJson);
      const servicesOfferedInfoArray = new TextEncoder().encode(
        servicesOfferedInfoJson
      );
      const licenseInfoArray = new TextEncoder().encode(licenseInfoJson);

      // Fetch the encrypted key
      const seed = window.crypto.getRandomValues(new Uint8Array(32));
      const tsk = new vetkd.TransportSecretKey(seed);
      const encryptedKeyResult =
        await actors.facility.encrypted_symmetric_key_for_facility(
          Object.values(tsk.public_key())
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

      const pkBytesHex = await actors.facility.symmetric_key_verification_key();
      const principal = await actors.facility.whoami();
      const aesGCMKey = tsk.decrypt_and_hash(
        hex_decode(encryptedKey),
        hex_decode(pkBytesHex),
        new TextEncoder().encode(principal),
        32,
        new TextEncoder().encode("aes-256-gcm")
      );

      const encryptedDataDemo = await aes_gcm_encrypt(demoInfoArray, aesGCMKey);
      const encryptedDataService = await aes_gcm_encrypt(
        servicesOfferedInfoArray,
        aesGCMKey
      );
      const encryptedDataLicense = await aes_gcm_encrypt(
        licenseInfoArray,
        aesGCMKey
      );

      const result = await actors.facility.createFacilityRequest(
        Object.values(encryptedDataDemo),
        Object.values(encryptedDataService),
        Object.values(encryptedDataLicense)
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

  const hex_decode = (hexString) =>
    Uint8Array.from(
      hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
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
              <h2 className="text-xl md:text-2xl font-bold">
                Register Service
              </h2>
              <Link to="/Register">
                <ChevronLeft />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="facultyName"
                >
                  Faculty Name *
                </label>
                <div className="mt-1">
                  <Input
                    id="facultyName"
                    placeholder="Faculty Name"
                    value={formData.facultyName}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.facultyName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.facultyName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="registrationId"
                >
                  Registration ID *
                </label>
                <div className="mt-1">
                  <Input
                    id="registrationId"
                    placeholder="Registration ID"
                    value={formData.registrationId}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.registrationId && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.registrationId}
                    </p>
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
                  htmlFor="city"
                >
                  City
                </label>
                <div className="mt-1">
                  <Input
                    id="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
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
                  htmlFor="serviceName"
                >
                  Service Name *
                </label>
                <div className="mt-1">
                  <Input
                    id="serviceName"
                    placeholder="Service Name"
                    value={formData.serviceName}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.serviceName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.serviceName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="serviceDesc"
                >
                  Service Description
                </label>
                <div className="mt-1">
                  <Input
                    id="serviceDesc"
                    placeholder="Service Description"
                    value={formData.serviceDesc}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={registerService}
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
