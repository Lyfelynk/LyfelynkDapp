import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Trophy } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const emojis = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔"]

export default function MatchCards() {
  const [cards, setCards] = useState([])
  const [flippedCards, setFlippedCards] = useState([])
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [level, setLevel] = useState(1)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isGameOver, setIsGameOver] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    startNewGame()
  }, [level])

  useEffect(() => {
    if (timeLeft > 0 && !isGameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !isGameOver) {
      endGame()
    }
  }, [timeLeft, isGameOver])

  const startNewGame = () => {
    const pairsCount = level * 2
    const shuffledEmojis = emojis
      .slice(0, pairsCount)
      .flatMap(emoji => [emoji, emoji])
      .sort(() => Math.random() - 0.5)

    const newCards = shuffledEmojis.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
    }))
    setCards(newCards)
    setFlippedCards([])
    setMatchedPairs(0)
    setTimeLeft(60)
    setIsGameOver(false)
  }

  const handleCardClick = (id) => {
    if (flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched || isGameOver) return

    const newCards = [...cards]
    newCards[id].isFlipped = true
    setCards(newCards)

    const newFlippedCards = [...flippedCards, id]
    setFlippedCards(newFlippedCards)

    if (newFlippedCards.length === 2) {
      const [firstId, secondId] = newFlippedCards
      if (cards[firstId].emoji === cards[secondId].emoji) {
        newCards[firstId].isMatched = true
        newCards[secondId].isMatched = true
        setCards(newCards)
        setMatchedPairs((prev) => prev + 1)
        setScore((prev) => prev + 10 * level)
        setFlippedCards([])

        if (matchedPairs + 1 === cards.length / 2) {
          handleLevelComplete()
        }
      } else {
        setTimeout(() => {
          newCards[firstId].isFlipped = false
          newCards[secondId].isFlipped = false
          setCards(newCards)
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  const handleLevelComplete = () => {
    setScore((prev) => prev + 50)
    setLevel((prev) => prev + 1)
    setTimeLeft(60)
  }

  const endGame = () => {
    setIsGameOver(true)
  }

  const restartGame = () => {
    setLevel(1)
    setScore(0)
    startNewGame()
  }

  return (
    <div className="flex flex-col items-center justify-center bg-background text-foreground p-4">
      <h1 className="text-3xl font-bold mb-4">Memory Card Flip</h1>
      <div className="mb-4 text-center">
        <p className="text-lg">Level: {level}</p>
        <p className="text-lg">Score: {score}</p>
        <Progress value={(timeLeft / 60) * 100} className="w-64 h-2 mt-2" />
        <p className="text-sm mt-1">Time Left: {timeLeft}s</p>
      </div>
      <div 
        className={`grid gap-4 mb-4 ${
          level <= 2 ? "grid-cols-4" : 
          level <= 4 ? "grid-cols-5" : 
          "grid-cols-6"
        }`}
      >
        {cards.map((card) => (
          <Card
            key={card.id}
            className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-2xl cursor-pointer transition-all duration-300 ${
              card.isFlipped || card.isMatched ? "bg-primary text-primary-foreground" : "bg-secondary"
            }`}
            onClick={() => handleCardClick(card.id)}
          >
            {card.isFlipped || card.isMatched ? (
              <span role="img" aria-label={`Emoji: ${card.emoji}`}>
                {card.emoji}
              </span>
            ) : (
              <span className="sr-only">Card face down</span>
            )}
          </Card>
        ))}
      </div>
      {isGameOver && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Game Over!</AlertTitle>
          <AlertDescription>
            You reached level {level} with a score of {score}.
          </AlertDescription>
        </Alert>
      )}
      {matchedPairs === cards.length / 2 && !isGameOver && (
        <Alert className="mb-4">
          <Trophy className="h-4 w-4" />
          <AlertTitle>Level Complete!</AlertTitle>
          <AlertDescription>Great job! Click "Next Level" to continue.</AlertDescription>
        </Alert>
      )}
      <div className="space-x-4">
        {isGameOver ? (
          <Button onClick={restartGame}>Restart Game</Button>
        ) : matchedPairs === cards.length / 2 ? (
          <Button onClick={handleLevelComplete}>Next Level</Button>
        ) : (
          <Button onClick={startNewGame}>Restart Level</Button>
        )}
      </div>
    </div>
  )
}
