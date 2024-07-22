export const calculateTotalNutrients = (itemsWithQuantities) => {
    const totalNutrients = { calories: 0, carbohydrates: 0, protein: 0, fat: 0 };
  
    itemsWithQuantities.forEach(([item, quantity]) => {
      totalNutrients.calories += item.calories * quantity;
      totalNutrients.carbohydrates += item.carbohydrates * quantity;
      totalNutrients.protein += item.protein * quantity;
      totalNutrients.fat += item.fat * quantity;
    });
  
    return totalNutrients;
  };