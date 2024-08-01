import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Hospital } from 'lucide-react';

const AnalyticsDashboard = () => {
  const weight = 165;
  const bmi = 24.2;
  const weightStatus = 'Normal';
  const height = "5'10\"";
  const calorieGoal = 2100;
  const caloriesConsumed = 1850;
  const caloriesRemaining = calorieGoal - caloriesConsumed;

  const dietPlan = {
    breakfast: ['1 cup of oatmeal with berries', '2 eggs scrambled', '1 slice of whole-wheat toast'],
    lunch: ['Grilled chicken salad with mixed greens', '1/2 cup of quinoa', '1 apple'],
    dinner: ['Baked salmon with roasted vegetables', '1 cup of brown rice', '1 glass of water'],
    snacks: ['1 cup of Greek yogurt with berries', '1 handful of almonds', '1 banana'],
  };

  return (
    <div>
      <div className="border border-gray-600 my-8"></div>
      <div className="flex items-center gap-2">
        <Hospital />
        <h1 className="text-3xl font-bold text-foreground">Health Dashboard</h1>
      </div>
      <main className="flex-1 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weight</CardTitle>
            <CardDescription>Current weight</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{weight} lbs</div>
            <div className="text-gray-500 dark:text-gray-400">
              <span className="font-medium">BMI:</span> {bmi}
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              <span className="font-medium">Status:</span> {weightStatus}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Height</CardTitle>
            <CardDescription>Current height</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{height}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Calorie Intake</CardTitle>
            <CardDescription>Daily calorie goal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{calorieGoal} cal</div>
            <div className="text-gray-500 dark:text-gray-400">
              <span className="font-medium">Consumed:</span> {caloriesConsumed} cal
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              <span className="font-medium">Remaining:</span> {caloriesRemaining} cal
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
                  {dietPlan.breakfast.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Lunch</h3>
                <ul className="space-y-2">
                  {dietPlan.lunch.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Dinner</h3>
                <ul className="space-y-2">
                  {dietPlan.dinner.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Snacks</h3>
                <ul className="space-y-2">
                  {dietPlan.snacks.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default AnalyticsDashboard;
