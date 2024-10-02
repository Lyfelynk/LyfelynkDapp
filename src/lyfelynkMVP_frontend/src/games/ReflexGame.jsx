import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

export default function ReflexGame() {
  const [gameState, setGameState] = useState("waiting");
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(null);

  const startGame = () => {
    setGameState("waiting");
    setReactionTime(null);
    const delay = Math.floor(Math.random() * 3000) + 1000; // Random delay between 1-4 seconds
    setTimeout(() => {
      setStartTime(Date.now());
      setGameState("ready");
    }, delay);
  };

  const handleClick = () => {
    if (gameState === "ready") {
      const endTime = Date.now();
      setReactionTime(endTime - startTime);
      setGameState("clicked");
    } else if (gameState === "waiting") {
      setGameState("clicked");
      setReactionTime(null);
    }
  };

  const handleKeyDown = useCallback(
    (event) => {
      if (event.code === "Space") {
        handleClick();
      }
    },
    [gameState, startTime],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-8">Quick Reflex Game</h1>
      <div
        className={`w-64 h-64 rounded-full flex items-center justify-center text-white text-2xl font-bold cursor-pointer mb-8 ${
          gameState === "waiting"
            ? "bg-red-500"
            : gameState === "ready"
              ? "bg-green-500"
              : "bg-blue-500"
        }`}
        onClick={handleClick}
      >
        {gameState === "waiting" && "Wait..."}
        {gameState === "ready" && "Click!"}
        {gameState === "clicked" &&
          (reactionTime ? `${reactionTime} ms` : "Too early!")}
      </div>
      <Button onClick={startGame} disabled={gameState === "waiting"}>
        {gameState === "waiting" ? "Game in progress..." : "Start Game"}
      </Button>
      <p className="mt-4 text-lg">
        Click the circle when it turns green, or press the spacebar.
      </p>
    </div>
  );
}
