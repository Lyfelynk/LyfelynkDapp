import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

const AvatarStatus = ({ avatar, onLevelUp, onRestoreHP }) => {
  const stats = [
    {
      name: "Energy",
      value: avatar.energy,
      max: 20,
      color: "bg-blue-400",
    },
    {
      name: "Focus",
      value: avatar.focus,
      max: 20,
      color: "bg-purple-400",
    },
    {
      name: "Vitality",
      value: avatar.vitality,
      max: 20,
      color: "bg-green-400",
    },
    {
      name: "Resilience",
      value: avatar.resilience,
      max: 20,
      color: "bg-yellow-400",
    },
  ];

  const maxHP = 100 + (avatar.level - 1) * 10;

  return (
    <div className="bg-gray-800 border border-gray-700 text-white p-4 rounded-lg mb-6">
      <div className="flex items-center text-blue-400 text-xl font-bold mb-4">
        <User className="mr-2" /> Avatar Status
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <img
            src="zephyr.jpeg"
            alt="Avatar"
            className="w-full h-auto rounded-lg"
          />
        </div>
        <div>
          <p className="text-lg font-semibold">{avatar.type}</p>
          <p className="text-sm text-gray-400 mb-2">
            Quality: {avatar.quality}
          </p>
          <p className="text-sm">Level: {avatar.level}</p>
          <p className="text-sm">Tokens: {avatar.tokens}</p>
          <p className="text-sm">Gems: {avatar.gems}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span>HP</span>
          <span className="text-sm text-blue-400">
            {avatar.hp} / {maxHP}
          </span>
        </div>
        <Progress value={(avatar.hp / maxHP) * 100} className="w-full" />
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

      <div className="flex space-x-2">
        <Button
          onClick={() => onRestoreHP(1)}
          disabled={avatar.tokens < 1 || avatar.hp >= maxHP}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Restore 1 HP (1 Token)
        </Button>
        <Button
          onClick={onLevelUp}
          disabled={avatar.tokens < avatar.level * 100}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Level Up ({avatar.level * 100} Tokens)
        </Button>
      </div>
    </div>
  );
};

export default AvatarStatus;
