import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronRightIcon } from "lucide-react";
import BMICalculator from "../../Functions/bmicalc";
import NutritionTracker from "../../Functions/NutrientCalc/NutritionTracker";
import AnalyticsDashboard from "../sub/AnalyticsDashboard";


const calculateBMI = (weight, height) => {
  return (weight / Math.pow(height / 100, 2)).toFixed(1);
};

const getWeightStatus = (bmi) => {
  if (bmi < 18.5) {
    return "Underweight";
  } else if (bmi >= 18.5 && bmi < 24.9) {
    return "Healthy weight";
  } else if (bmi >= 25 && bmi < 29.9) {
    return "Overweight";
  } else {
    return "Obese";
  }
};

const weightKg = 70; // Weight in kilograms
const heightCm = 175; // Height in centimeters
const bmi = calculateBMI(weightKg, heightCm);
const weightStatus = getWeightStatus(bmi);

export default function AnalyticsContent() {
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
            <div className="grid gap-4 py-4">
              <BMICalculator/>
              {/* Add your form inputs or other content here */}
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <div className="max-w-xl group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-50">Calorie Intake</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Track your daily calorie intake to manage your weight effectively.</p>
                </div>
                <ChevronRightIcon className="h-6 w-6 text-gray-500 transition-transform duration-200 group-hover:translate-x-1 dark:text-gray-400" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Calorie Intake</DialogTitle>
              <DialogDescription>
                Track your daily calorie intake to manage your weight effectively.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <NutritionTracker/>

            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </div>

      <AnalyticsDashboard />
      
    </div>
  );
}


