import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRightIcon } from "lucide-react";
import BMICalculator from "../../Functions/bmicalc";
import NutritionTracker from "../../Functions/NutrientCalc/NutritionTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function AnalyticsContent() {
  const [healthData, setHealthData] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('healthDashboardData');
      return savedData ? JSON.parse(savedData) : {
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('healthDashboardData', JSON.stringify(updatedData));
      }
      return updatedData;
    });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('healthDashboardData', JSON.stringify(healthData));
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('healthDashboardData', JSON.stringify(defaultData));
    }
  };

  const getBMIColor = (bmi) => {
    if (bmi < 18.5) return "#3B82F6"; // blue
    if (bmi < 25) return "#10B981"; // green
    if (bmi < 30) return "#F59E0B"; // yellow
    return "#EF4444"; // red
  };

  const BMIChart = ({ bmi }) => {
    const normalizedBMI = Math.min(Math.max(bmi, 0), 40) / 40; // Normalize BMI to 0-1 range, capping at 40
    const data = [
      { name: 'BMI', value: normalizedBMI },
      { name: 'Remaining', value: 1 - normalizedBMI },
    ];

    return (
      <ResponsiveContainer width="70%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
          >
            <Cell fill={getBMIColor(bmi)} />
            <Cell fill="#FFFFFF" /> {/* Light gray for the remaining */}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const NutritionOverview = ({ calories, proteinIntake, carbIntake, fatIntake }) => {
    const totalNutrients = proteinIntake + carbIntake + fatIntake;
    const proteinPercentage = (proteinIntake / totalNutrients) * 100;
    const carbPercentage = (carbIntake / totalNutrients) * 100;
    const fatPercentage = (fatIntake / totalNutrients) * 100;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Daily Calorie Intake</span>
          <span className="text-2xl font-bold text-blue-600">{calories} kcal</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Protein</span>
            <span className="font-semibold">{proteinIntake}g ({proteinPercentage.toFixed(1)}%)</span>
          </div>
          <Progress value={proteinPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-green-500" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Carbohydrates</span>
            <span className="font-semibold">{carbIntake}g ({carbPercentage.toFixed(1)}%)</span>
          </div>
          <Progress value={carbPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-blue-500" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Fat</span>
            <span className="font-semibold">{fatIntake}g ({fatPercentage.toFixed(1)}%)</span>
          </div>
          <Progress value={fatPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-yellow-500" />
        </div>
      </div>
    );
  };

  const HealthDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400">Body Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Height</span>
            <span className="text-lg font-semibold">{healthData.height} cm</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Weight</span>
            <span className="text-lg font-semibold">{healthData.weight} kg</span>
          </div>
          <div className="flex justify-center items-center">
            <BMIChart bmi={healthData.bmi} />
            <div className="flex flex-col p-4">
              <span className={`text-3xl font-bold ${getBMIColor(healthData.bmi)}`}>
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
          <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">Nutrition Overview</CardTitle>
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
          <CardTitle className="text-2xl font-bold text-purple-600 dark:text-purple-400">Recommended Diet Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap">{healthData.dietPlan}</pre>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-foreground">Health Analytics</h1>
      <p className="mt-2 text-base text-gray-600">
        Explore and Analyze Your Health Data Effectively.
      </p>

      <div className="py-4 grid grid-cols-2 gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <div className="max-w-xl group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-50">BMI Calculator</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Assess your weight status and maintain a healthy lifestyle.</p>
                </div>
                <ChevronRightIcon className="h-6 w-6 text-gray-500 transition-transform duration-200 group-hover:translate-x-1 dark:text-gray-400" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>BMI Calculator</DialogTitle>
              <DialogDescription>
                Assess your weight status and maintain a healthy lifestyle.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] sm:h-[600px]">
              <div className="grid gap-4 py-4">
                <BMICalculator updateHealthData={updateHealthData} />
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <div className="max-w-xl group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-50">Nutrition Tracker</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Track your daily nutrients intake to maintain a healthy lifestyle.</p>
                </div>
                <ChevronRightIcon className="h-6 w-6 text-gray-500 transition-transform duration-200 group-hover:translate-x-1 dark:text-gray-400" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nutrition Tracker</DialogTitle>
              <DialogDescription>
                Track your daily nutrients intake to maintain a healthy lifestyle.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] sm:h-[600px]">
              <div className="grid gap-4 py-4">
                <NutritionTracker updateHealthData={updateHealthData} />
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <HealthDashboard />
      <Button onClick={resetHealthData} className="mt-4">Reset Dashboard</Button>
    </div>
  );
}