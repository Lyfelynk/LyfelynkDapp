import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

const AvatarStatus = ({ avatar, onLevelUp, onRestoreHP, userTokens }) => {
  const stats = [
    {
      name: "Energy",
      value: avatar.energy,
      max: avatar.energy,
      color: "bg-blue-400",
    },
    {
      name: "Focus",
      value: avatar.focus,
      max: avatar.focus,
      color: "bg-purple-400",
    },
    {
      name: "Vitality",
      value: avatar.vitality,
      max: avatar.vitality,
      color: "bg-green-400",
    },
    {
      name: "Resilience",
      value: avatar.resilience,
      max: avatar.resilience,
      color: "bg-yellow-400",
    },
  ];

  const maxHP = 100 + (avatar.level - 1) * 10;

  return (
    <div className="bg-gray-800 border border-gray-700 text-white p-4 rounded-lg mb-6 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center text-blue-400 text-xl font-bold mb-4 sticky top-0 bg-gray-800 py-2 z-10">
        <User className="mr-2" /> Avatar Status
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <img
            src={avatar.image}
            alt="Avatar"
            className="w-full h-auto rounded-lg"
          />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-lg font-semibold">{avatar.type}</p>
          <p className="text-sm text-gray-400 mb-2">
            Quality: {avatar.quality}
          </p>
          <p className="text-sm">Level: {avatar.level}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span>HP</span>
          <span className="text-sm text-blue-400">{avatar.hp}</span>
        </div>
        <Progress value={100} className="w-full" />
      </div>

      <div className="space-y-4 mb-4">
        {stats.map((stat) => (
          <div key={stat.name} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{stat.name}</span>
              <span className="text-blue-400">
                {stat.value} / {stat.max}
              </span>
            </div>
            <Progress
              value={(stat.value / stat.max) * 100}
              className={`w-full ${stat.color}`}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sticky bottom-0 bg-gray-800 py-2 z-10">
        <Button
          onClick={() => onRestoreHP(10)}
          disabled={userTokens < 10 || avatar.hp >= 100}
          className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
        >
          Restore 10 HP (10 Tokens)
        </Button>
        <Button
          onClick={onLevelUp}
          disabled={userTokens < avatar.level * 100}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
        >
          Level Up ({avatar.level * 100} Tokens)
        </Button>
      </div>
    </div>
  );
};

export default AvatarStatus;
