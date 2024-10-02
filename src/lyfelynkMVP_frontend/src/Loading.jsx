import React, { useState, useEffect } from "react";
import { Brain, Heart, Syringe, Activity, Apple, Moon } from "lucide-react";

const healthSystems = [
  { icon: Brain, name: "Cognitive", color: "text-purple-500" },
  { icon: Heart, name: "Cardiovascular", color: "text-red-500" },
  { icon: Syringe, name: "Respiratory", color: "text-blue-500" },
  { icon: Activity, name: "Fitness", color: "text-green-500" },
  { icon: Apple, name: "Nutrition", color: "text-yellow-500" },
  { icon: Moon, name: "Sleep", color: "text-indigo-500" },
];

function Loading() {
  const [progress, setProgress] = useState(0);
  const [activeSystem, setActiveSystem] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prevProgress + 1;
      });
    }, 50);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        {/* <h1 className="text-4xl font-bold mb-4 text-blue-600">HealthSync</h1> */}
        {/* <p className="text-xl text-gray-600 mb-8">Harmonizing Your Wellbeing</p> */}

        <div className="relative w-64 h-64">
          {/* Circular progress bar */}
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className="text-gray-200 stroke-current"
              strokeWidth="8"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            />
            <circle
              className="text-blue-500 progress-ring__circle stroke-current"
              strokeWidth="8"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
            />
          </svg>

          {/* Percentage in the middle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-blue-600">
              {progress}%
            </span>
          </div>

          {/* Health system icons */}
          {healthSystems.map((system, index) => {
            const angle =
              (index / healthSystems.length) * 2 * Math.PI - Math.PI / 2;
            const x = 50 + 48 * Math.cos(angle);
            const y = 50 + 48 * Math.sin(angle);
            const IconComponent = system.icon; // Assign the icon component dynamically

            return (
              <div
                key={system.name}
                className={`absolute w-12 h-12 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center ${system.color} transition-all duration-300 ease-in-out ${activeSystem === system.name ? "scale-125" : "scale-100"}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                onMouseEnter={() => setActiveSystem(system.name)}
                onMouseLeave={() => setActiveSystem(null)}
              >
                <IconComponent size={24} /> {/* Render the icon dynamically */}
              </div>
            );
          })}
        </div>

        {/* Info text */}
        <p className="mt-8 text-lg text-gray-700 h-8">
          {activeSystem
            ? `Loading ${activeSystem} data...`
            : "Taking care of your health..."}
        </p>
      </div>
    </div>
  );
}

export default Loading;
