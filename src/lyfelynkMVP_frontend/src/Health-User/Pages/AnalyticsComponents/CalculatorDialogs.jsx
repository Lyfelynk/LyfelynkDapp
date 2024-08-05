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
import BMICalculator from "../../../Functions/bmicalc";
import NutritionTracker from "../../../Functions/NutrientCalc/NutritionTracker";
  
  export default function CalculatorDialogs({ updateHealthData }) {
    return (
      <div className="py-4 grid grid-cols-2 gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <div className="max-w-xl group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-50">
                    BMI Calculator
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Assess your weight status and maintain a healthy lifestyle.
                  </p>
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
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-50">
                    Nutrition Tracker
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Track your daily nutrients intake to maintain a healthy
                    lifestyle.
                  </p>
                </div>
                <ChevronRightIcon className="h-6 w-6 text-gray-500 transition-transform duration-200 group-hover:translate-x-1 dark:text-gray-400" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nutrition Tracker</DialogTitle>
              <DialogDescription>
                Track your daily nutrients intake to maintain a healthy
                lifestyle.
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
    );
  }