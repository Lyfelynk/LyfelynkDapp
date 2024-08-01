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
import { parseCSV } from "./csvParser";

// Assume we have a CSV parser function

const NutritionTracker = () => {
  const [data, setData] = useState([]);
  const [numMeals, setNumMeals] = useState(1);
  const [meals, setMeals] = useState([]);
  const [totalNutrients, setTotalNutrients] = useState({});

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
    setMeals(
      Array(numMeals)
        .fill()
        .map(() => []),
    );
  }, [numMeals]);

  const unitBasedItems = {
    egg: 50,
    sandwich: 150,
    roti: 40,
    paratha: 60,
    cup: 240,
    bowl: 350,
  };

  const stringMatchSearch = (query) => {
    // Implement fuzzy search here
    return data
      .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  };

  const calculateNutrients = (items) => {
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

    items.forEach(({ item, quantity, isUnit }) => {
      const foodItem = data.find((d) => d.name === item);
      if (foodItem) {
        const quantityInGrams = isUnit
          ? quantity * (unitBasedItems[item.toLowerCase()] || 100)
          : quantity;
        const factor = quantityInGrams / 100.0;
        Object.keys(totalNutrients).forEach((key) => {
          totalNutrients[key] += (foodItem[key] || 0) * factor;
        });
      }
    });

    return Object.fromEntries(
      Object.entries(totalNutrients).map(([key, value]) => [
        key,
        Number(value.toFixed(2)),
      ]),
    );
  };

  const handleAddItem = (mealIndex) => {
    setMeals((prevMeals) => {
      const newMeals = [...prevMeals];
      newMeals[mealIndex] = [
        ...newMeals[mealIndex],
        { item: "", quantity: 0, isUnit: false },
      ];
      return newMeals;
    });
  };

  const handleItemChange = (mealIndex, itemIndex, field, value) => {
    setMeals((prevMeals) => {
      const newMeals = [...prevMeals];
      newMeals[mealIndex][itemIndex][field] = value;
      return newMeals;
    });
  };

  const handleCalculate = () => {
    const mealNutrients = meals.map((meal) => calculateNutrients(meal));
    const total = mealNutrients.reduce((acc, curr) => {
      Object.keys(curr).forEach((key) => {
        acc[key] = (acc[key] || 0) + curr[key];
      });
      return acc;
    }, {});
    setTotalNutrients(total);
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
      <h1 className="text-2xl font-bold mb-4">
        Food Calorie and Nutrient Tracker
      </h1>

      <div className="mb-4">
        <Input
          type="number"
          value={numMeals}
          onChange={(e) => setNumMeals(Number(e.target.value))}
          placeholder="Number of meals"
          className="w-full"
        />
      </div>

      {meals.map((meal, mealIndex) => (
        <Card key={mealIndex} className="mb-4">
          <CardHeader>
            <CardTitle>Meal {mealIndex + 1}</CardTitle>
          </CardHeader>
          <CardContent>
            {meal.map((item, itemIndex) => (
              <div key={itemIndex} className="flex space-x-2 mb-2">
                <Select
                  onValueChange={(value) =>
                    handleItemChange(mealIndex, itemIndex, "item", value)
                  }
                  value={item.item}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select food item" />
                  </SelectTrigger>
                  <SelectContent>
                    {stringMatchSearch(item.item).map((food) => (
                      <SelectItem key={food.name} value={food.name}>
                        {food.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(
                      mealIndex,
                      itemIndex,
                      "quantity",
                      Number(e.target.value),
                    )
                  }
                  placeholder="Quantity"
                />
                <Select
                  onValueChange={(value) =>
                    handleItemChange(
                      mealIndex,
                      itemIndex,
                      "isUnit",
                      value === "units",
                    )
                  }
                  value={item.isUnit ? "units" : "grams"}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grams">grams</SelectItem>
                    <SelectItem value="units">units</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Button onClick={() => handleAddItem(mealIndex)}>Add Item</Button>
          </CardContent>
        </Card>
      ))}

      <Button onClick={handleCalculate} className="mb-4">
        Calculate Nutrients
      </Button>

      {Object.keys(totalNutrients).length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-2">Total Nutrients</h2>
          <ul>
            {Object.entries(totalNutrients).map(([key, value]) => (
              <li key={key}>
                {key}: {value}
              </li>
            ))}
          </ul>

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
