import React, { useState, useEffect } from "react";
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card";
import { Dna, Footprints, GlassWater, Heart, User, Weight } from "lucide-react";
import { useCanister } from "@connect2ic/react";
import LoadingScreen from "../LoadingScreen";

import * as vetkd from "ic-vetkd-utils";

function HealthAnalyticsOld() {
  const [lyfelynkMVP_backend] = useCanister("lyfelynkMVP_backend");
  const [loading, setLoading] = useState(false);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

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

  const fetchUserData = async () => {
    setLoading(true);
    const userCategory = await lyfelynkMVP_backend.isRegistered();

    if (userCategory == "User") {
      try {
        const result = await lyfelynkMVP_backend.readUser();
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
          setAge(calculateAge(parsedDemographicInfo.dob));
          setHeight(parsedBasicHealthParams.height);
          setWeight(parsedBasicHealthParams.weight);
          setGender(parsedDemographicInfo.gender);
          setLoading(false);
        } else {
          setLoading(false);
          alert(result.err);
        }
      } catch (error) {
        setLoading(false);
        console.error("Error fetching user data:", error);
      }
    } else if (userCategory == "Professional") {
      try {
        const result = await lyfelynkMVP_backend.readProfessional();
        if (result.ok) {
          const { IDNum, UUID, MetaData } = result.ok;
          const {
            DemographicInformation,
            OccupationInformation,
            CertificationInformation,
          } = MetaData;

          // Step 1: Retrieve the encrypted key using encrypted_symmetric_key_for_dataAsset

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

          const decryptedDataDemographic = await aes_gcm_decrypt(
            DemographicInformation,
            aesGCMKey
          );
          const decryptedDataOccupation = await aes_gcm_decrypt(
            OccupationInformation,
            aesGCMKey
          );
          const decryptedDataCertification = await aes_gcm_decrypt(
            CertificationInformation,
            aesGCMKey
          );

          const parsedDemographicInfo = JSON.parse(
            String.fromCharCode.apply(null, decryptedDataDemographic)
          );
          const parsedOccupationInfo = JSON.parse(
            String.fromCharCode.apply(null, decryptedDataOccupation)
          );
          const parsedCertificationInfo = JSON.parse(
            String.fromCharCode.apply(null, decryptedDataCertification)
          );

          setAge(calculateAge(parsedDemographicInfo.dob));
          setHeight(parsedDemographicInfo.height);
          setWeight(parsedDemographicInfo.weight);
          setGender(parsedDemographicInfo.gender);
          setLoading(false);
        } else {
          alert("Error fetching professional data:", result.err);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching professional data:", error);
        setLoading(false);
      }
    } else {
      setLoading(false);
      console.log("pass");
    }
  };

  function calculateAge(dateString) {
    const birthDate = new Date(dateString);
    const currentDate = new Date();
    const diffInMs = currentDate.getTime() - birthDate.getTime();
    const ageInYears = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 365.25));

    return ageInYears;
  }

  const calculateBMI = () => {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(2);
  };

  const getHealthStatus = () => {
    const bmi = calculateBMI();
    if (bmi < 18.5) return "Underweight";
    if (bmi >= 18.5 && bmi <= 24.9) return "Healthy";
    if (bmi >= 25 && bmi <= 29.9) return "Overweight";
    return "Obese";
  };

  const getRecommendedSteps = () => {
    if (age >= 18 && age <= 64) return "7,000-10,000";
    if (age >= 65) return "5,000-7,000";
    return "10,000-14,000";
  };

  const getRecommendedWaterIntake = () => {
    if (gender === "male") return "3.7 liters";
    return "2.7 liters";
  };

  const getStatusColor = () => {
    const status = getHealthStatus();
    switch (status) {
      case "Underweight":
        return "bg-blue-400";
      case "Healthy":
        return "bg-green-500";
      case "Overweight":
        return "bg-yellow-400";
      case "Obese":
        return "bg-red-500";
      default:
        return "bg-gray-200";
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [lyfelynkMVP_backend]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-8 space-y-0">
          <CardTitle className="text-sm font-medium">Age</CardTitle>
          <User className="w-4 h-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{age}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-8 space-y-0">
          <CardTitle className="text-sm font-medium">Gender</CardTitle>
          <Dna className="w-4 h-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{gender}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-8 space-y-0">
          <CardTitle className="text-sm font-medium">BMI</CardTitle>
          <Weight className="w-4 h-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{calculateBMI()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-8 space-y-0">
          <CardTitle className="text-sm font-medium">Health Status</CardTitle>
          <Heart className="w-4 h-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold px-2 rounded-sm ${getStatusColor()}`}
          >
            {getHealthStatus()}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-8 space-y-0">
          <CardTitle className="text-sm font-medium">
            Rec. Daily Steps
          </CardTitle>
          <Footprints className="w-4 h-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getRecommendedSteps()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-8 space-y-0">
          <CardTitle className="text-sm font-medium">
            Rec. Daily Water Intake
          </CardTitle>
          <GlassWater className="w-4 h-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {getRecommendedWaterIntake()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HealthAnalyticsOld;
