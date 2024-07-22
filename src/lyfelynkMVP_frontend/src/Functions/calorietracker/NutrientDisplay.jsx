import React from 'react';

const NutrientDisplay = ({ nutrients }) => (
  <div className="border p-4 rounded shadow-lg">
    <h3 className="text-lg font-bold mb-2">Total Nutrients</h3>
    <p>Calories: {nutrients.calories}</p>
    <p>Carbohydrates: {nutrients.carbohydrates}g</p>
    <p>Protein: {nutrients.protein}g</p>
    <p>Fat: {nutrients.fat}g</p>
  </div>
);

export default NutrientDisplay;