import React from "react";
import { Button } from "@/components/ui/button";
import { INITIAL_ATTRIBUTES } from "./constants";

const GemMarketplace = ({ gems, tokens, onBuyGem, onUseGem }) => {
  return (
    <div className="bg-gray-800 border border-gray-700 text-white p-4 rounded-lg mb-6">
      <h2 className="text-xl font-semibold mb-4 text-blue-400">
        Gem Marketplace
      </h2>
      <p className="mb-2">Gems: {gems}</p>
      <p className="mb-4">Tokens: {tokens}</p>
      <Button
        onClick={onBuyGem}
        disabled={tokens < 16}
        className="bg-purple-600 hover:bg-purple-700 text-white mb-4"
      >
        Buy Gem (16 Tokens)
      </Button>
      <div className="grid grid-cols-2 gap-2">
        {Object.keys(INITIAL_ATTRIBUTES).map((attr) => (
          <Button
            key={attr}
            onClick={() => onUseGem(attr)}
            disabled={gems === 0}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Use Gem on {attr}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default GemMarketplace;
