import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

const colors = ["red", "blue", "green", "yellow", "purple", "orange"];

export default function ColorConfusion() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);
  const [targetColor, setTargetColor] = useState("");
  const [buttonColors, setButtonColors] = useState([]);

  const generateNewRound = useCallback(() => {
    const newTargetColor = colors[Math.floor(Math.random() * colors.length)];
    const otherColors = colors
      .filter((color) => color !== newTargetColor)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const newButtonColors = [...otherColors, newTargetColor]
      .sort(() => Math.random() - 0.5)
      .map((color) => ({
        name: colors[Math.floor(Math.random() * colors.length)],
        background: color,
      }));

    setTargetColor(newTargetColor);
    setButtonColors(newButtonColors);
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameStarted(true);
    generateNewRound();
  };

  const handleButtonClick = (clickedColor) => {
    if (clickedColor === targetColor) {
      setScore((prevScore) => prevScore + 1);
    } else {
      setScore((prevScore) => Math.max(0, prevScore - 1));
    }
    generateNewRound();
  };

  useEffect(() => {
    let timer;
    if (gameStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setGameStarted(false);
    }
    return () => clearInterval(timer);
  }, [gameStarted, timeLeft]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">Color Confusion Game</h1>
      {!gameStarted ? (
        <Button onClick={startGame} className="text-xl px-6 py-3">
          Start Game
        </Button>
      ) : (
        <>
          <div className="text-2xl mb-4">
            Time Left: {timeLeft}s | Score: {score}
          </div>
          <div
            className="text-3xl font-bold mb-6"
            style={{ color: colors[Math.floor(Math.random() * colors.length)] }}
          >
            {targetColor.toUpperCase()}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {buttonColors.map((color, index) => (
              <Button
                key={index}
                onClick={() => handleButtonClick(color.background)}
                className="w-32 h-32 text-white text-xl font-bold"
                style={{ backgroundColor: color.background }}
              >
                {color.name.toUpperCase()}
              </Button>
            ))}
          </div>
        </>
      )}
      {timeLeft === 0 && (
        <div className="mt-8 text-2xl">Game Over! Final Score: {score}</div>
      )}
    </div>
  );
}
