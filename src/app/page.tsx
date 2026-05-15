'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const GRID_SIZE = 20
const CELL_SIZE = 20
const CANVAS_WIDTH = GRID_SIZE * CELL_SIZE
const CANVAS_HEIGHT = GRID_SIZE * CELL_SIZE
const BASE_SPEED = 150
const SPEED_INCREMENT = 10
const POINTS_PER_LEVEL = 5

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type GameState = 'START' | 'PLAYING' | 'GAMEOVER'

interface Point {
  x: number
  y: number
}

function randomFood(snake: Point[]): Point {
  let pos: Point
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    }
  } while (snake.some(s => s.x === pos.x && s.y === pos.y))
  return pos
}

function getSpeed(score: number): number {
  const level = Math.floor(score / POINTS_PER_LEVEL)
  return Math.max(60, BASE_SPEED - level * SPEED_INCREMENT)
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef<GameState>('START')
  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }])
  const directionRef = useRef<Direction>('RIGHT')
  const nextDirectionRef = useRef<Direction>('RIGHT')
  const foodRef = useRef<Point>(randomFood([{ x: 10, y: 10 }]))
  const scoreRef = useRef(0)
  const highScoreRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [displayState, setDisplayState] = useState<GameState>('START')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('snake-highscore')
    if (saved) {
      const hs = parseInt(saved, 10)
      highScoreRef.current = hs
      setHighScore(hs)
    }
  }, [])

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Grid
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, CANVAS_HEIGHT)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(CANVAS_WIDTH, i * CELL_SIZE)
      ctx.stroke()
    }

    // Food
    const food = foodRef.current
    ctx.fillStyle = '#ff4444'
    ctx.shadowColor = '#ff4444'
    ctx.shadowBlur = 10
    ctx.fillRect(
      food.x * CELL_SIZE + 2,
      food.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4
    )
    ctx.shadowBlur = 0

    // Snake
    const snake = snakeRef.current
    snake.forEach((segment, index) => {
      if (index === 0) {
        ctx.fillStyle = '#00ff88'
        ctx.shadowColor = '#00ff88'
        ctx.shadowBlur = 8
      } else {
        const alpha = 1 - (index / snake.length) * 0.4
        ctx.fillStyle = `rgba(0, 200, 100, ${alpha})`
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
      }
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      )
    })
    ctx.shadowBlur = 0
  }, [])

  const stopGame = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return

    directionRef.current = nextDirectionRef.current
    const snake = snakeRef.current
    const head = snake[0]
    const dir = directionRef.current

    const newHead: Point = {
      x: head.x + (dir === 'RIGHT' ? 1 : dir === 'LEFT' ? -1 : 0),
      y: head.y + (dir === 'DOWN' ? 1 : dir === 'UP' ? -1 : 0)
    }

    // Wall collision
    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE
    ) {
      gameStateRef.current = 'GAMEOVER'
      setDisplayState('GAMEOVER')
      stopGame()
      if (scoreRef.current > highScoreRef.current) {
        highScoreRef.current = scoreRef.current
        setHighScore(scoreRef.current)
        localStorage.setItem('snake-highscore', String(scoreRef.current))
      }
      drawGame()
      return
    }

    // Self collision
    if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      gameStateRef.current = 'GAMEOVER'
      setDisplayState('GAMEOVER')
      stopGame()
      if (scoreRef.current > highScoreRef.current) {
        highScoreRef.current = scoreRef.current
        setHighScore(scoreRef.current)
        localStorage.setItem('snake-highscore', String(scoreRef.current))
      }
      drawGame()
      return
    }

    const newSnake = [newHead, ...snake]
    const food = foodRef.current

    if (newHead.x === food.x && newHead.y === food.y) {
      // Ate food
      const newScore = scoreRef.current + 1
      scoreRef.current = newScore
      setScore(newScore)
      foodRef.current = randomFood(newSnake)
      snakeRef.current = newSnake

      // Restart interval with new speed
      stopGame()
      const speed = getSpeed(newScore)
      intervalRef.current = setInterval(tick, speed)
    } else {
      newSnake.pop()
      snakeRef.current = newSnake
    }

    drawGame()
  }, [drawGame, stopGame])

  const startGame = useCallback(() => {
    stopGame()
    const initialSnake = [{ x: 10, y: 10 }]
    snakeRef.current = initialSnake
    directionRef.current = 'RIGHT'
    nextDirectionRef.current = 'RIGHT'
    foodRef.current = randomFood(initialSnake)
    scoreRef.current = 0
    setScore(0)
    gameStateRef.current = 'PLAYING'
    setDisplayState('PLAYING')
    drawGame()
    intervalRef.current = setInterval(tick, BASE_SPEED)
  }, [stopGame, drawGame, tick])

  useEffect(() => {
    drawGame()
  }, [drawGame])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key
      const dir = directionRef.current

      if (
        (key === 'ArrowUp' || key === 'w' || key === 'W') &&
        dir !== 'DOWN'
      ) {
        nextDirectionRef.current = 'UP'
        e.preventDefault()
      } else if (
        (key === 'ArrowDown' || key === 's' || key === 'S') &&
        dir !== 'UP'
      ) {
        nextDirectionRef.current = 'DOWN'
        e.preventDefault()
      } else if (
        (key === 'ArrowLeft' || key === 'a' || key === 'A') &&
        dir !== 'RIGHT'
      ) {
        nextDirectionRef.current = 'LEFT'
        e.preventDefault()
      } else if (
        (key === 'ArrowRight' || key === 'd' || key === 'D') &&
        dir !== 'LEFT'
      ) {
        nextDirectionRef.current = 'RIGHT'
        e.preventDefault()
      } else if (key === 'Enter' || key === ' ') {
        if (gameStateRef.current === 'START' || gameStateRef.current === 'GAMEOVER') {
          startGame()
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [startGame])

  const handleDpad = useCallback((dir: Direction) => {
    const current = directionRef.current
    if (dir === 'UP' && current !== 'DOWN') nextDirectionRef.current = 'UP'
    else if (dir === 'DOWN' && current !== 'UP') nextDirectionRef.current = 'DOWN'
    else if (dir === 'LEFT' && current !== 'RIGHT') nextDirectionRef.current = 'LEFT'
    else if (dir === 'RIGHT' && current !== 'LEFT') nextDirectionRef.current = 'RIGHT'
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
      <h1 className="text-2xl text-green-400 mb-4 tracking-widest" style={{ fontFamily: "'Press Start 2P', monospace" }}>
        SNAKE
      </h1>

      {/* Score */}
      <div className="flex gap-8 mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: "'Press Start 2P', monospace" }}>SCORE</div>
          <div className="text-lg text-yellow-400" style={{ fontFamily: "'Press Start 2P', monospace" }}>{score}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: "'Press Start 2P', monospace" }}>BEST</div>
          <div className="text-lg text-yellow-400" style={{ fontFamily: "'Press Start 2P', monospace" }}>{highScore}</div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative border-2 border-green-800">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block"
        />

        {/* Start overlay */}
        {displayState === 'START' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80"
          >
            <div className="text-green-400 text-sm mb-6" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              PRESS START
            </div>
            <div className="text-gray-400 text-xs mb-2" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              WASD / ARROWS
            </div>
            <button
              onClick={startGame}
              className="mt-4 px-6 py-3 bg-green-600 text-black text-xs hover:bg-green-400 transition-colors"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              START
            </button>
          </div>
        )}

        {/* Game Over overlay */}
        {displayState === 'GAMEOVER' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80"
          >
            <div className="text-red-500 text-sm mb-4" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              GAME OVER
            </div>
            <div className="text-yellow-400 text-xs mb-2" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              SCORE: {score}
            </div>
            {score >= highScore && score > 0 && (
              <div className="text-green-400 text-xs mb-4" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                NEW RECORD!
              </div>
            )}
            <button
              onClick={startGame}
              className="mt-4 px-6 py-3 bg-green-600 text-black text-xs hover:bg-green-400 transition-colors"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              RETRY
            </button>
          </div>
        )}
      </div>

      {/* Speed indicator */}
      {displayState === 'PLAYING' && (
        <div className="mt-2 text-xs text-gray-600" style={{ fontFamily: "'Press Start 2P', monospace" }}>
          LVL {Math.floor(score / POINTS_PER_LEVEL) + 1}
        </div>
      )}

      {/* D-Pad for mobile */}
      <div className="mt-6 grid grid-rows-3 grid-cols-3 gap-1 w-36">
        <div />
        <button
          onPointerDown={() => handleDpad('UP')}
          className="flex items-center justify-center h-12 bg-gray-800 text-green-400 text-lg hover:bg-gray-700 active:bg-gray-600 select-none border border-gray-600"
        >
          ▲
        </button>
        <div />
        <button
          onPointerDown={() => handleDpad('LEFT')}
          className="flex items-center justify-center h-12 bg-gray-800 text-green-400 text-lg hover:bg-gray-700 active:bg-gray-600 select-none border border-gray-600"
        >
          ◄
        </button>
        <div className="flex items-center justify-center h-12 bg-gray-900 border border-gray-700">
          <div className="w-2 h-2 bg-green-800 rounded-full" />
        </div>
        <button
          onPointerDown={() => handleDpad('RIGHT')}
          className="flex items-center justify-center h-12 bg-gray-800 text-green-400 text-lg hover:bg-gray-700 active:bg-gray-600 select-none border border-gray-600"
        >
          ►
        </button>
        <div />
        <button
          onPointerDown={() => handleDpad('DOWN')}
          className="flex items-center justify-center h-12 bg-gray-800 text-green-400 text-lg hover:bg-gray-700 active:bg-gray-600 select-none border border-gray-600"
        >
          ▼
        </button>
        <div />
      </div>
    </div>
  )
}
