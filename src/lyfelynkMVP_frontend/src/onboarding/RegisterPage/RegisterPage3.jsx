import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import LoadingScreen from "../../LoadingScreen";

import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
// Connect2ic: Import Connect2ic library to interact with the backend canister
import { useCanister } from "@connect2ic/react";
//
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingBanner from "../../OnboardingBanner";
import * as vetkd from "ic-vetkd-utils";

export default function RegisterPage3Content() {
  // Connect2ic: Use the "lyfelynkMVP_backend" canister

  const [lyfelynkMVP_backend] = useCanister("lyfelynkMVP_backend");
  //

  const navigate = useNavigate();
  const [facultyName, setFacultyName] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const registerService = async () => {
    setLoading(true);

    const demoInfo = {
      facultyName,
      country,
      state,
      city,
      pincode,
    };

    const servicesOfferedInfo = {
      serviceName,
      serviceDesc,
    };

    const licenseInfo = {
      registrationId,
    };

    // Convert demoInfo, servicesOfferedInfo, and licenseInfo objects to JSON strings
    const demoInfoJson = JSON.stringify(demoInfo);
    const servicesOfferedInfoJson = JSON.stringify(servicesOfferedInfo);
    const licenseInfoJson = JSON.stringify(licenseInfo);

    // Convert JSON strings to Uint8Array
    const demoInfoArray = new TextEncoder().encode(demoInfoJson);
    const servicesOfferedInfoArray = new TextEncoder().encode(
      servicesOfferedInfoJson
    );
    const licenseInfoArray = new TextEncoder().encode(licenseInfoJson);

    // Step 2: Fetch the encrypted key using encrypted_symmetric_key_for_dataAsset
    const seed = window.crypto.getRandomValues(new Uint8Array(32));
    const tsk = new vetkd.TransportSecretKey(seed);
    const encryptedKeyResult =
      await lyfelynkMVP_backend.encrypted_symmetric_key_for_user(
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
      new TextEncoder().encode("aes-256-gcm")
    );
    console.log(aesGCMKey);

    const encryptedDataDemo = await aes_gcm_encrypt(demoInfoArray, aesGCMKey);
    const encryptedDataService = await aes_gcm_encrypt(
      servicesOfferedInfoArray,
      aesGCMKey
    );
    const encryptedDataLicense = await aes_gcm_encrypt(
      licenseInfoArray,
      aesGCMKey
    );
    const result = await lyfelynkMVP_backend.createFacility(
      Object.values(encryptedDataDemo),
      Object.values(encryptedDataService),
      Object.values(encryptedDataLicense)
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
                  htmlFor="facultyname"
                >
                  Faculty Name
                </label>
                <div className="mt-1">
                  <Input
                    id="facultyname"
                    placeholder="Faculty Name"
                    value={facultyName}
                    onChange={(e) => setFacultyName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="regId"
                >
                  Registeration ID
                </label>
                <div className="mt-1">
                  <Input
                    id="regId"
                    placeholder="Registeration ID"
                    value={registrationId}
                    onChange={(e) => setRegistrationId(e.target.value)}
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
                  htmlFor="city"
                >
                  City
                </label>
                <div className="mt-1">
                  <Input
                    id="city"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
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

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="service_name"
                >
                  Service Name
                </label>
                <div className="mt-1">
                  <Input
                    id="service_name"
                    placeholder="Service Name"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium leading-5 text-foreground"
                  htmlFor="service_name"
                >
                  Service Desc
                </label>
                <div className="mt-1">
                  <Input
                    id="service_name"
                    placeholder="Service Desc"
                    value={serviceDesc}
                    onChange={(e) => setServiceDesc(e.target.value)}
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
