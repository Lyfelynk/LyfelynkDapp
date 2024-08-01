import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCanister } from "@connect2ic/react";
import { useState, useEffect } from "react";
import LoadingScreen from "../../LoadingScreen";
import * as vetkd from "ic-vetkd-utils";
import { toast } from "@/components/ui/use-toast";
export default function ProfileContent() {
  const [lyfelynkMVP_backend] = useCanister("lyfelynkMVP_backend");
  const [facilityData, setFacilityData] = useState(null);
  const [facultyName, setFacultyName] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [loading, setLoading] = useState(false);

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

  const aes_gcm_decrypt = async (encryptedData, rawKey) => {
    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);
    const aes_key = await window.crypto.subtle.importKey(
      "raw",
      rawKey,
      "AES-GCM",
      false,
      ["decrypt"],
    );
    const decrypted_buffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      aes_key,
      ciphertext,
    );
    return new Uint8Array(decrypted_buffer);
  };
  const hex_decode = (hexString) =>
    Uint8Array.from(
      hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)),
    );

  useEffect(() => {
    const fetchFacilityData = async () => {
      try {
        const result = await lyfelynkMVP_backend.readFacility();
        if (result.ok) {
          const { IDNum, UUID, MetaData } = result.ok;
          const {
            DemographicInformation,
            ServicesOfferedInformation,
            LicenseInformation,
          } = MetaData;

          // Step 1: Retrieve the encrypted key using encrypted_symmetric_key_for_dataAsset

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
          const decryptedDataDemo = await aes_gcm_decrypt(
            DemographicInformation,
            aesGCMKey,
          );
          const decryptedDataService = await aes_gcm_decrypt(
            ServicesOfferedInformation,
            aesGCMKey,
          );
          const decryptedDataLicense = await aes_gcm_decrypt(
            LicenseInformation,
            aesGCMKey,
          );
          const parsedDemographicInfo = JSON.parse(
            String.fromCharCode.apply(null, decryptedDataDemo),
          );
          const parsedServicesOfferedInfo = JSON.parse(
            String.fromCharCode.apply(null, decryptedDataService),
          );
          const parsedLicenseInfo = JSON.parse(
            String.fromCharCode.apply(null, decryptedDataLicense),
          );

          setFacilityData({
            IDNum,
            UUID,
            DemographicInformation: parsedDemographicInfo,
            ServicesOfferedInformation: parsedServicesOfferedInfo,
            LicenseInformation: parsedLicenseInfo,
          });
        } else {
          alert(result.err);
        }
      } catch (error) {
        console.error("Error fetching facility data:", error);
      }
    };

    fetchFacilityData();
  }, [lyfelynkMVP_backend]);

  useEffect(() => {
    if (facilityData) {
      setFacultyName(facilityData.DemographicInformation.facultyName || "");
      setRegistrationId(facilityData.LicenseInformation.registrationId || "");
      setCountry(facilityData.DemographicInformation.country || "");
      setState(facilityData.DemographicInformation.state || "");
      setCity(facilityData.DemographicInformation.city || "");
      setPincode(facilityData.DemographicInformation.pincode || "");
      setServiceName(facilityData.ServicesOfferedInformation.serviceName || "");
      setServiceDesc(facilityData.ServicesOfferedInformation.serviceDesc || "");
    }
  }, [facilityData]);

  const handleUpdateFacility = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
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
        servicesOfferedInfoJson,
      );
      const licenseInfoArray = new TextEncoder().encode(licenseInfoJson);

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
      const encryptedDataService = await aes_gcm_encrypt(
        servicesOfferedInfoArray,
        aesGCMKey,
      );
      const encryptedDataLicense = await aes_gcm_encrypt(
        licenseInfoArray,
        aesGCMKey,
      );
      const result = await lyfelynkMVP_backend.updateFacility(
        Object.values(encryptedDataDemo),
        Object.values(encryptedDataService),
        Object.values(encryptedDataLicense),
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
      console.error("Error updating facility data:", error);
    }
  };
  if (loading) {
    return <LoadingScreen />;
  }
  if (!facilityData) {
    return <LoadingScreen />;
  }
  return (
    <div>
      <div className="h-min py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-screen-sm">
          <h1 className="text-center text-4xl font-bold leading-9 ">
            Update Profile
          </h1>
          <p className="mt-2 text-center text-sm leading-5 text-gray-600">
            Update your Profile Information
          </p>
          <form className="mt-8" onSubmit={handleUpdateFacility}>
            <div className="rounded-md shadow-sm">
              <div className="flex flex-col items-center">
                <Avatar className="-z-10 w-36 h-36">
                  <AvatarImage alt="John Lenon" src="" />
                  <AvatarFallback className="text-4xl">JL</AvatarFallback>
                </Avatar>

                <div className="flex space-x-2 py-4">
                  <p>ID Number:- {facilityData.IDNum}</p>
                  <p>UUID:- {facilityData.UUID}</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-y-6 gap-x-4 ">
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
            </div>
            <div className="mt-6">
              <Button className="w-full" type="submit">
                Update
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
