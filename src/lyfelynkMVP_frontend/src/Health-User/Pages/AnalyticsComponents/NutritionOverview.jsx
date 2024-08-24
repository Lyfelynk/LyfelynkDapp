import { Progress } from "@/components/ui/progress";

export default function NutritionOverview({
  calories,
  proteinIntake,
  carbIntake,
  fatIntake,
}) {
  const totalNutrients = proteinIntake + carbIntake + fatIntake;
  const proteinPercentage = (proteinIntake / totalNutrients) * 100;
  const carbPercentage = (carbIntake / totalNutrients) * 100;
  const fatPercentage = (fatIntake / totalNutrients) * 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold">Daily Calorie Intake</span>
        <span className="text-2xl font-bold text-blue-600">
          {calories} kcal
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span>Protein</span>
          <span className="font-semibold">
            {proteinIntake}g ({proteinPercentage.toFixed(1)}%)
          </span>
        </div>
        <Progress
          value={proteinPercentage}
          className="h-2 bg-gray-200"
          indicatorClassName="bg-green-500"
        />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span>Carbohydrates</span>
          <span className="font-semibold">
            {carbIntake}g ({carbPercentage.toFixed(1)}%)
          </span>
        </div>
        <Progress
          value={carbPercentage}
          className="h-2 bg-gray-200"
          indicatorClassName="bg-blue-500"
        />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span>Fat</span>
          <span className="font-semibold">
            {fatIntake}g ({fatPercentage.toFixed(1)}%)
          </span>
        </div>
        <Progress
          value={fatPercentage}
          className="h-2 bg-gray-200"
          indicatorClassName="bg-yellow-500"
        />
      </div>
    </div>
  );
}
