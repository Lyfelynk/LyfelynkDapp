import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const BMICalculator = ({ updateHealthData }) => {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [preference, setPreference] = useState("Veg");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const calculateBMI = () => {
    const weightNum = parseFloat(weight);
    const heightCmNum = parseFloat(height);

    setError(null);

    if (weightNum > 0 && heightCmNum > 0) {
      const heightMeters = heightCmNum / 100;
      const bmi = weightNum / heightMeters ** 2;
      const category = getBMICategory(bmi);

      const results = {
        bmi: bmi.toFixed(2),
        category,
        dietChart: generateDietChart(category, preference),
      };

      setResults(results);

      updateHealthData({
        height: heightCmNum,
        weight: weightNum,
        bmi: bmi.toFixed(2),
        bmiStatus: category,
        dietPlan: results.dietChart,
      });
      console.log("BMI Calculator updating health data");
    } else {
      if (weightNum <= 0) {
        setError("Please enter a positive value for weight.");
      }
      if (heightCmNum <= 0) {
        setError("Please enter a positive value for height.");
      }
    }
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 24.9) return "Normal weight";
    if (bmi < 29.9) return "Overweight";
    return "Obesity";
  };

  const generateDietChart = (category, preference) => {
    const diets = {
      Underweight: {
        Veg: [
          [
            "Breakfast",
            "Oats with milk and fruits, nuts (almonds, walnuts)",
            450,
          ],
          ["Mid-Morning Snack", "Banana shake, a handful of dry fruits", 300],
          ["Lunch", "Dal, paneer curry, chapati, rice, salad, and yogurt", 700],
          [
            "Evening Snack",
            "Smoothie with nuts, whole-grain toast with avocado",
            250,
          ],
          ["Dinner", "Vegetable curry, chapati, quinoa, and salad", 600],
          ["Before Bed", "A glass of milk with honey", 150],
        ],
        "Non-Veg": [
          [
            "Breakfast",
            "Omelette with vegetables, whole-grain toast, and a glass of milk",
            500,
          ],
          [
            "Mid-Morning Snack",
            "Chicken or turkey slices, a handful of nuts",
            250,
          ],
          [
            "Lunch",
            "Grilled chicken, dal, chapati, rice, salad, and yogurt",
            750,
          ],
          [
            "Evening Snack",
            "Protein shake, whole-grain toast with chicken spread",
            300,
          ],
          ["Dinner", "Fish curry, chapati, quinoa, and salad", 600],
          ["Before Bed", "A glass of milk with honey", 150],
        ],
      },
      "Normal weight": {
        Veg: [
          [
            "Breakfast",
            "Smoothie bowl with fruits and nuts, whole-grain toast",
            350,
          ],
          ["Mid-Morning Snack", "Fresh fruit, a handful of seeds", 150],
          [
            "Lunch",
            "Dal, mixed vegetable curry, chapati, brown rice, and salad",
            600,
          ],
          ["Evening Snack", "Carrot sticks with hummus, herbal tea", 150],
          ["Dinner", "Paneer tikka, chapati, quinoa, and vegetable soup", 500],
          ["Before Bed", "Herbal tea or warm milk", 50],
        ],
        "Non-Veg": [
          [
            "Breakfast",
            "Scrambled eggs with vegetables, whole-grain toast, and a glass of fresh juice",
            400,
          ],
          ["Mid-Morning Snack", "Greek yogurt with berries", 150],
          [
            "Lunch",
            "Grilled chicken breast, dal, chapati, brown rice, and salad",
            600,
          ],
          ["Evening Snack", "Boiled eggs, herbal tea", 150],
          ["Dinner", "Fish curry, chapati, quinoa, and vegetable soup", 500],
          ["Before Bed", "Herbal tea or warm milk", 50],
        ],
      },
      Overweight: {
        Veg: [
          ["Breakfast", "Smoothie with spinach, apple, and flaxseeds", 300],
          ["Mid-Morning Snack", "Fresh fruit", 100],
          [
            "Lunch",
            "Dal, mixed vegetable curry, chapati, and a small portion of brown rice, salad",
            500,
          ],
          [
            "Evening Snack",
            "Sliced cucumber and carrot sticks, green tea",
            100,
          ],
          [
            "Dinner",
            "Grilled vegetables, chapati, and a bowl of lentil soup",
            400,
          ],
          ["Before Bed", "Warm water with lemon", 50],
        ],
        "Non-Veg": [
          ["Breakfast", "Boiled eggs, whole-grain toast, and green tea", 300],
          ["Mid-Morning Snack", "Fresh fruit, a handful of walnuts", 150],
          [
            "Lunch",
            "Grilled chicken salad with lots of greens, dal, and a small portion of brown rice",
            500,
          ],
          [
            "Evening Snack",
            "Sliced cucumber and carrot sticks, green tea",
            100,
          ],
          [
            "Dinner",
            "Baked fish, steamed vegetables, and a bowl of lentil soup",
            400,
          ],
          ["Before Bed", "Warm water with lemon", 50],
        ],
      },
      Obesity: {
        Veg: [
          [
            "Breakfast",
            "Green smoothie with spinach, kale, cucumber, and apple",
            250,
          ],
          ["Mid-Morning Snack", "Fresh fruit", 100],
          [
            "Lunch",
            "Mixed bean salad, vegetable curry, chapati, and a small portion of quinoa",
            400,
          ],
          [
            "Evening Snack",
            "Sliced bell peppers and carrots with hummus, green tea",
            100,
          ],
          [
            "Dinner",
            "Steamed vegetables, chapati, and a bowl of clear vegetable soup",
            300,
          ],
          ["Before Bed", "Warm water with lemon", 50],
        ],
        "Non-Veg": [
          [
            "Breakfast",
            "Egg white omelette with vegetables, whole-grain toast, and green tea",
            250,
          ],
          ["Mid-Morning Snack", "Fresh fruit", 100],
          [
            "Lunch",
            "Grilled chicken breast, mixed green salad, and a small portion of quinoa",
            400,
          ],
          [
            "Evening Snack",
            "Sliced bell peppers and carrots with hummus, green tea",
            100,
          ],
          [
            "Dinner",
            "Steamed fish, steamed vegetables, and a bowl of clear vegetable soup",
            300,
          ],
          ["Before Bed", "Warm water with lemon", 50],
        ],
      },
    };

    return diets[category][preference]
      .map((meal) => `${meal[0]} (${meal[2]} kcal):\n${meal[1]}\n`)
      .join("\n");
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full shadow-md rounded-lg p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Enter your weight in kilograms:</Label>
            <Input
              type="number"
              id="weight"
              step="0.1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Enter your height in centimeters:</Label>
            <Input
              type="number"
              id="height"
              step="0.1"
              min="0"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preference">Diet Preference:</Label>
            <Select value={preference} onValueChange={setPreference}>
              <SelectTrigger>
                <SelectValue placeholder="Select preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Veg">Veg</SelectItem>
                <SelectItem value="Non-Veg">Non-Veg</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={calculateBMI} className="w-full">
            Calculate BMI
          </Button>
        </div>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {results && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold text-blue-800">
              Your BMI is: {results.bmi}
            </h2>
            <h2 className="text-xl font-semibold text-blue-800">
              Category: {results.category}
            </h2>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">
                Suggested {preference} Diet Chart:
              </h3>
              <pre className="whitespace-pre-wrap text-sm font-normal">
                {results.dietChart}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BMICalculator;
