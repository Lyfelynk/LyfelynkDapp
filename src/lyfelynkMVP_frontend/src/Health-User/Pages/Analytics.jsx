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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChevronRightIcon, Hospital } from "lucide-react";
import CalorieIntake from "../../Functions/calorietracker/calorieintake";
import BMICalculator from "../../Functions/bmicalc";


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
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Calorie Intake</DialogTitle>
              <DialogDescription>
                Track your daily calorie intake to manage your weight effectively.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <CalorieIntake/>
              {/* Add your form inputs or other content here */}
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </div>

      <div className="border border-gray-600 my-8 "></div>

      <div className="flex items-center gap-2">
        <Hospital/> 
        <h1 className="text-3xl font-bold text-foreground"> Health Dashboard</h1>
      </div>

      <main className="flex-1 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weight</CardTitle>
            <CardDescription>Current weight</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">165 lbs</div>
            <div className="text-gray-500 dark:text-gray-400">
              <span className="font-medium">BMI:</span> 24.2
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              <span className="font-medium">Status:</span> Normal
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Height</CardTitle>
            <CardDescription>Current height</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">5'10"</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Calorie Intake</CardTitle>
            <CardDescription>Daily calorie goal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">2,100 cal</div>
            <div className="text-gray-500 dark:text-gray-400">
              <span className="font-medium">Consumed:</span> 1,850 cal
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              <span className="font-medium">Remaining:</span> 250 cal
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Personalized Diet Plan</CardTitle>
            <CardDescription>Your recommended daily diet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold mb-2">Breakfast</h3>
                <ul className="space-y-2">
                  <li>1 cup of oatmeal with berries</li>
                  <li>2 eggs scrambled</li>
                  <li>1 slice of whole-wheat toast</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Lunch</h3>
                <ul className="space-y-2">
                  <li>Grilled chicken salad with mixed greens</li>
                  <li>1/2 cup of quinoa</li>
                  <li>1 apple</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Dinner</h3>
                <ul className="space-y-2">
                  <li>Baked salmon with roasted vegetables</li>
                  <li>1 cup of brown rice</li>
                  <li>1 glass of water</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Snacks</h3>
                <ul className="space-y-2">
                  <li>1 cup of Greek yogurt with berries</li>
                  <li>1 handful of almonds</li>
                  <li>1 banana</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


