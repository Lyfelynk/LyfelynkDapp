import { useState } from 'react';
import { User, Heart, Info, Star } from 'lucide-react'; // Importing specific icons

export default function AvatarDesc() {
  const stats = [
    { name: "Energy", value: 583, max: 700, color: "bg-blue-400" },
    { name: "Focus", value: 5366, max: 10000, color: "bg-purple-400" },
    { name: "Vitality", value: 417, max: 1000, color: "bg-green-400" },
    { name: "Resilience", value: 250, max: 850, color: "bg-yellow-400" },
  ];

  return (
    <div className="bg-gray-900 text-white p-4 md:p-6 lg:p-8 min-h-screen">
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
        Avatar - Nutrition Expert
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="bg-gray-800 border border-gray-700 text-white p-4 rounded-lg">
            <div className="flex items-center text-blue-400 text-xl font-bold mb-4">
              <User className="mr-2" /> Avatar
            </div>
            <div className="relative aspect-square w-full max-w-[300px] mx-auto">
              <img
                src="/placeholder.png"
                alt="Legendary Avatar"
                className="rounded-lg bg-white"
              />
              <span className="absolute top-2 left-2 bg-yellow-500 text-black font-bold px-2 py-1 rounded-md">
                LEGENDARY
              </span>
            </div>
          </div>

          {/* Status Section */}
          <div className="bg-gray-800 border border-gray-700 text-white p-4 rounded-lg">
            <div className="flex items-center text-blue-400 text-xl font-bold mb-4">
              <Heart className="mr-2" /> Status
            </div>
            <div className="text-lg font-semibold mb-2">Level 1</div>
            <div className="text-sm font-semibold mb-2">Tokens: 100</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>HP</span>
                <span className="text-sm text-blue-400">583 / 700</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400" style={{ width: '83%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Description Section */}
          <div className="bg-gray-800 border border-gray-700 text-white p-4 rounded-lg">
            <div className="flex items-center text-blue-400 text-xl font-bold mb-4">
              <Info className="mr-2" /> Description
            </div>
            <p className="text-sm leading-relaxed">
              Codyfighters are the heart of Codyfight, a dynamic AI-powered
              strategy game. Tasked with a critical mission, they aim to save Earth
              by outsmarting the notorious Mr. Ryo. Players can choose from seven
              distinct archetypes and five levels of rarity, each Codyfighter
              reflecting their strategic decisions and hard-fought battles. Kicking off
              this epic saga is the Genesis collection, marking the thrilling pre-
              season of Codyfight and setting the stage for the extraordinary
              journey ahead.
            </p>
          </div>

          {/* Traits Section */}
          <div className="bg-gray-800 border border-gray-700 text-white p-4 rounded-lg">
            <div className="flex items-center text-blue-400 text-xl font-bold mb-4">
              <Star className="mr-2" /> Traits
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full">Nutrition Expert</span>
              <span className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full">Health</span>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-gray-800 border border-gray-700 text-white p-4 rounded-lg">
            <div className="text-blue-400 text-xl font-bold mb-4">Stats</div>
            <div className="space-y-4">
              {stats.map((stat) => (
                <div key={stat.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{stat.name}</span>
                    <span className="text-blue-400">{stat.value} / {stat.max}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className={`${stat.color} h-full`} style={{ width: `${(stat.value / stat.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
