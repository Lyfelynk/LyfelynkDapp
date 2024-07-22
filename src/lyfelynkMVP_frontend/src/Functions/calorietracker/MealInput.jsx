import React, { useState } from 'react';
import { foodData } from './FoodData';

const MealInput = ({ meal, onAddItem }) => {
  const [query, setQuery] = useState('');
  const [quantity, setQuantity] = useState(0);

  const handleAddItem = () => {
    const selectedItem = foodData.find(food => food.name.toLowerCase() === query.toLowerCase());
    if (selectedItem) {
      onAddItem(selectedItem, quantity);
      setQuery('');
      setQuantity(0);
    } else {
      alert('Item not found');
    }
  };

  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold">{meal}</h2>
      <input
        type="text"
        placeholder="Enter food item"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border bg-background text-foreground rounded-sm p-2 mr-2"
      />
      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(parseFloat(e.target.value))}
        className="border bg-background text-foreground rounded-sm p-2 mr-2"
      />
      <button onClick={handleAddItem} className="bg-blue-500 text-white p-2 rounded-sm">Add</button>
    </div>
  );
};

export default MealInput;