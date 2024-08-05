import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import CalculatorDialogs from "./AnalyticsComponents/CalculatorDialogs";
import HealthDashboard from "./AnalyticsComponents/HealthDashboard";

export default function AnalyticsContent() {
  const [healthData, setHealthData] = useState(() => {
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem("healthDashboardData");
      return savedData
        ? JSON.parse(savedData)
        : {
            height: 0,
            weight: 0,
            bmi: 0,
            bmiStatus: "",
            calories: 0,
            dietPlan: "",
            proteinIntake: 0,
            carbIntake: 0,
            fatIntake: 0,
          };
    }
    return {
      height: 0,
      weight: 0,
      bmi: 0,
      bmiStatus: "",
      calories: 0,
      dietPlan: "",
      proteinIntake: 0,
      carbIntake: 0,
      fatIntake: 0,
    };
  });

  const updateHealthData = useCallback((newData) => {
    setHealthData((prevData) => {
      const updatedData = { ...prevData, ...newData };
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "healthDashboardData",
          JSON.stringify(updatedData),
        );
      }
      return updatedData;
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("healthDashboardData", JSON.stringify(healthData));
    }
  }, [healthData]);

  const resetHealthData = () => {
    const defaultData = {
      height: 0,
      weight: 0,
      bmi: 0,
      bmiStatus: "",
      calories: 0,
      dietPlan: "",
      proteinIntake: 0,
      carbIntake: 0,
      fatIntake: 0,
    };
    setHealthData(defaultData);
    if (typeof window !== "undefined") {
      localStorage.setItem("healthDashboardData", JSON.stringify(defaultData));
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-foreground">Health Analytics</h1>
      <p className="mt-2 text-base text-gray-600">
        Explore and Analyze Your Health Data Effectively.
      </p>

      <CalculatorDialogs updateHealthData={updateHealthData} />
      <HealthDashboard healthData={healthData} />
      
      <Button onClick={resetHealthData} className="flex items-center mt-4">
        <RefreshCcw className="mr-2 w-4 h-4" />
        Reset Data
      </Button>
    </div>
  );
}