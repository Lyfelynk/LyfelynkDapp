import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function BMIChart({ bmi }) {
  const normalizedBMI = Math.min(Math.max(bmi, 0), 40) / 40;
  const data = [
    { name: "BMI", value: normalizedBMI },
    { name: "Remaining", value: 1 - normalizedBMI },
  ];

  const getBMIColor = (bmi) => {
    if (bmi < 18.5) return "#3B82F6";
    if (bmi < 25) return "#10B981";
    if (bmi < 30) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <ResponsiveContainer width="70%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
        >
          <Cell fill={getBMIColor(bmi)} />
          <Cell fill="#FFFFFF" />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
