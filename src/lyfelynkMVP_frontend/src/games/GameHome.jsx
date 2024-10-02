import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Zap, Grid3X3 } from "lucide-react"
import ReflexGame from './ReflexGame'
import MatchCards from './MatchCards'

export default function GameHome() {
  const [openReflexGame, setOpenReflexGame] = useState(false)
  const [openMatchCards, setOpenMatchCards] = useState(false)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Mini Games</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Dialog open={openReflexGame} onOpenChange={setOpenReflexGame}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Reflex Game</CardTitle>
                <CardDescription>Test your reaction time!</CardDescription>
              </CardHeader>
              <CardContent>
                <Zap className="w-12 h-12 mx-auto text-yellow-500" />
              </CardContent>
              <CardFooter>
                <Button className="w-full">Play Now</Button>
              </CardFooter>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Reflex Game</DialogTitle>
              <DialogDescription>Click when the light turns green!</DialogDescription>
            </DialogHeader>
            <ReflexGame />
          </DialogContent>
        </Dialog>

        <Dialog open={openMatchCards} onOpenChange={setOpenMatchCards}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Match Cards</CardTitle>
                <CardDescription>Find matching pairs of cards!</CardDescription>
              </CardHeader>
              <CardContent>
                <Grid3X3 className="w-12 h-12 mx-auto text-blue-500" />
              </CardContent>
              <CardFooter>
                <Button className="w-full">Play Now</Button>
              </CardFooter>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Match Cards</DialogTitle>
              <DialogDescription>Match all the pairs to win!</DialogDescription>
            </DialogHeader>
            <MatchCards />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
