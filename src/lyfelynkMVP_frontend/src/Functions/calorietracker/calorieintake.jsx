// src/CalorieIntake.js
import React, { useState } from 'react';
import NutrientDisplay from './NutrientDisplay';
import { calculateTotalNutrients } from './calculate';
import MealInput from './MealInput';

const CalorieIntake = () => {
  const [mealItems, setMealItems] = useState([]);

  const handleAddItem = (item, quantity) => {
    setMealItems([...mealItems, [item, quantity]]);
  };

  const totalNutrients = calculateTotalNutrients(mealItems);

  return (
    <div className="container mx-auto p-4">
      {['breakfast', 'lunch', 'dinner'].map(meal => (
        <MealInput key={meal} meal={meal} onAddItem={handleAddItem} />
      ))}
      <NutrientDisplay nutrients={totalNutrients} />
    </div>
  );
};

export default CalorieIntake;
