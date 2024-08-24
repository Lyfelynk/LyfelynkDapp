import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Leaf, Salad } from "lucide-react";
import BMIChart from "./BMIChart";
import NutritionOverview from "./NutritionOverview";

export default function HealthDashboard({ healthData }) {
  const getBMIColor = (bmi) => {
    if (bmi < 18.5) return "#3B82F6"; // blue
    if (bmi < 25) return "#10B981"; // green
    if (bmi < 30) return "#F59E0B"; // yellow
    return "#EF4444"; // red
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold text-blue-600 dark:text-blue-400">
            <Activity className="mr-2" />
            Body Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Height</span>
            <span className="text-lg font-semibold">
              {healthData.height} cm
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Weight</span>
            <span className="text-lg font-semibold">
              {healthData.weight} kg
            </span>
          </div>
          <div className="flex justify-center items-center">
            <BMIChart bmi={healthData.bmi} />
            <div className="flex flex-col p-4">
              <span
                className={`text-3xl font-bold ${getBMIColor(healthData.bmi)}`}
              >
                {healthData.bmi}
              </span>
              <span className="text-lg font-medium text-gray-700 dark:text-gray-200 mt-2">
                BMI - {healthData.bmiStatus}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold text-green-600 dark:text-green-400">
            <Leaf className="mr-2" />
            Nutrition Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NutritionOverview
            calories={healthData.calories}
            proteinIntake={healthData.proteinIntake}
            carbIntake={healthData.carbIntake}
            fatIntake={healthData.fatIntake}
          />
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold text-purple-600 dark:text-purple-400">
            <Salad className="mr-2" />
            Recommended Diet Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="p-4 border rounded-md whitespace-pre-wrap">
            {healthData.dietPlan}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
