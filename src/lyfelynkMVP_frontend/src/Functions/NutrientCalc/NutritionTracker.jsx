import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { Search } from "lucide-react";
import { parseCSV } from "./csvParser";

const NutritionTracker = ({ updateHealthData }) => {
  const [data, setData] = useState([]);
  const [meals, setMeals] = useState([]);
  const [totalNutrients, setTotalNutrients] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    // Load and parse CSV data
    const loadData = async () => {
      const response = await fetch("./nutrition_data.csv");
      const csvText = await response.text();
      const parsedData = parseCSV(csvText);
      setData(parsedData);
    };
    loadData();
  }, []);

  useEffect(() => {
    setSearchResults(stringMatchSearch(searchQuery));
  }, [searchQuery, data]);

  const unitBasedItems = {
    egg: 50,
    sandwich: 150,
    roti: 40,
    paratha: 60,
    cup: 240,
    bowl: 350,
  };

  const stringMatchSearch = (query) => {
    if (!query) return [];
    return data
      .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  };

  const calculateNutrients = (meals) => {
    const totalNutrients = {
      calories: 0,
      carbohydrates_total_g: 0,
      protein_g: 0,
      fat_total_g: 0,
      fat_saturated_g: 0,
      sodium_mg: 0,
      potassium_mg: 0,
      cholesterol_mg: 0,
      fiber_g: 0,
      sugar_g: 0,
    };

    meals.forEach((meal) => {
      const quantityInGrams = meal.isUnit
        ? meal.quantity * (unitBasedItems[meal.name.toLowerCase()] || 100)
        : meal.quantity;
      const factor = quantityInGrams / 100.0;
      Object.keys(totalNutrients).forEach((key) => {
        totalNutrients[key] += (meal[key] || 0) * factor;
      });
    });

    return Object.fromEntries(
      Object.entries(totalNutrients).map(([key, value]) => [
        key,
        Number(value.toFixed(2)),
      ]),
    );
  };

  const handleAddMeal = (selectedFood) => {
    setMeals((prevMeals) => [
      ...prevMeals,
      { ...selectedFood, quantity: 100, isUnit: false },
    ]);
    setSearchQuery("");
  };

  const handleRemoveMeal = (index) => {
    setMeals((prevMeals) => prevMeals.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setMeals((prevMeals) => {
      const newMeals = [...prevMeals];
      newMeals[index][field] = value;
      return newMeals;
    });
  };

  const handleCalculate = () => {
    const total = calculateNutrients(meals);
    setTotalNutrients(total);

    // Update the main Analytics component's state
    updateHealthData({
      calories: total.calories,
      proteinIntake: total.protein_g,
      carbIntake: total.carbohydrates_total_g,
      fatIntake: total.fat_total_g,
    });

    console.log("Nutrition Tracker updating health data", total);
  };

  const renderPieChart = () => {
    const data = [
      { name: "Carbohydrates", value: totalNutrients.carbohydrates_total_g },
      { name: "Protein", value: totalNutrients.protein_g },
      { name: "Fat", value: totalNutrients.fat_total_g },
    ];
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

    return (
      <PieChart width={400} height={400}>
        <Pie
          data={data}
          cx={200}
          cy={200}
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    );
  };

  const renderBarChart = () => {
    const data = [
      { name: "Total Fat", value: totalNutrients.fat_total_g },
      { name: "Saturated Fat", value: totalNutrients.fat_saturated_g },
      { name: "Protein", value: totalNutrients.protein_g },
      { name: "Sodium", value: totalNutrients.sodium_mg / 100 }, // Scaled down for visibility
      { name: "Potassium", value: totalNutrients.potassium_mg / 100 }, // Scaled down for visibility
      { name: "Cholesterol", value: totalNutrients.cholesterol_mg },
      { name: "Carbs", value: totalNutrients.carbohydrates_total_g },
      { name: "Fiber", value: totalNutrients.fiber_g },
      { name: "Sugar", value: totalNutrients.sugar_g },
    ];

    return (
      <BarChart width={600} height={300} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#8884d8" />
      </BarChart>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 relative">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a food item"
          className="w-full mb-2 pr-10"
        />
        <Search className="absolute right-2 top-2.5 w-5 h-5 text-gray-400" />
        {searchResults.map((food) => (
          <Button
            key={food.name}
            onClick={() => handleAddMeal(food)}
            className="mr-2 mb-2"
          >
            {food.name}
          </Button>
        ))}
      </div>

      {meals.map((meal, index) => (
        <Card key={index} className="mb-4">
          <CardHeader>
            <CardTitle>{meal.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-2">
              <Input
                type="number"
                value={meal.quantity}
                onChange={(e) =>
                  handleItemChange(index, "quantity", Number(e.target.value))
                }
                placeholder="Quantity"
              />
              <Select
                onValueChange={(value) =>
                  handleItemChange(index, "isUnit", value === "units")
                }
                value={meal.isUnit ? "units" : "grams"}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grams">grams</SelectItem>
                  <SelectItem value="units">units</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => handleRemoveMeal(index)}>Remove</Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button onClick={handleCalculate} className="mb-4">
        Calculate Nutrients
      </Button>

      {Object.keys(totalNutrients).length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-2">Total Nutrients</h2>
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr>
                <th className="border border-gray-200 px-4 py-2">Nutrient</th>
                <th className="border border-gray-200 px-4 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(totalNutrients).map(([key, value]) => (
                <tr key={key}>
                  <td className="border border-gray-200 px-4 py-2">{key}</td>
                  <td className="border border-gray-200 px-4 py-2">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">Macronutrient Breakdown</h3>
            {renderPieChart()}
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">Nutrient Breakdown</h3>
            {renderBarChart()}
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionTracker;
