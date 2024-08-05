import React, { useState, useCallback } from "react";
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

export default function AnalyticsContent() {
  const [healthData, setHealthData] = useState({
    height: 0,
    weight: 0,
    bmi: 0,
    bmiStatus: "",
    calories: 0,
    dietPlan: "",
    proteinIntake: 0,
    carbIntake: 0,
    fatIntake: 0,
  });

  const updateHealthData = useCallback((newData) => {
    setHealthData((prevData) => {
      console.log("Updating health data:", { ...prevData, ...newData });
      return { ...prevData, ...newData };
    });
  }, []);

  const HealthDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Body Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Height: {healthData.height} cm</p>
          <p>Weight: {healthData.weight} kg</p>
          <p>BMI: {healthData.bmi}</p>
          <p>BMI Status: {healthData.bmiStatus}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Nutrition Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Daily Calorie Intake: {healthData.calories} kcal</p>
          <p>Protein: {healthData.proteinIntake}g</p>
          <Progress value={healthData.proteinIntake / 2} className="mt-2" />
          <p>Carbohydrates: {healthData.carbIntake}g</p>
          <Progress value={healthData.carbIntake / 3} className="mt-2" />
          <p>Fat: {healthData.fatIntake}g</p>
          <Progress value={healthData.fatIntake / 1} className="mt-2" />
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Recommended Diet Plan</CardTitle>
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
    </div>
  );
}