'use client'

import { useEffect, useRef } from 'react'

type SnowfallProps = {
  density?: number
}

type Flake = {
  x: number
  y: number
  radius: number
  speed: number
  drift: number
  phase: number
}

const DEFAULT_COUNT = 90

const createFlake = (width: number, height: number): Flake => ({
  x: Math.random() * width,
  y: Math.random() * height,
  radius: 1 + Math.random() * 2.2,
  speed: 0.6 + Math.random() * 1.4,
  drift: (Math.random() - 0.5) * 0.8,
  phase: Math.random() * Math.PI * 2,
})

export const Snowfall = ({ density = 1 }: SnowfallProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const flakes: Flake[] = []
    let width = window.innerWidth
    let height = window.innerHeight
    let animationId = 0

    const targetCount = Math.max(24, Math.round(DEFAULT_COUNT * density))

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      if (flakes.length === 0) {
        for (let index = 0; index < targetCount; index += 1) {
          flakes.push(createFlake(width, height))
        }
      }
    }

    const update = () => {
      context.clearRect(0, 0, width, height)
      flakes.forEach((flake, index) => {
        flake.y += flake.speed
        flake.phase += 0.01
        flake.x += Math.sin(flake.phase) * flake.drift

        if (flake.y > height + 4) {
          flakes[index] = createFlake(width, 0)
          flakes[index].y = -6
        }
        if (flake.x > width + 4) {
          flakes[index].x = -4
        } else if (flake.x < -4) {
          flakes[index].x = width + 4
        }

        context.beginPath()
        context.fillStyle = 'rgba(255, 255, 255, 0.8)'
        context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2)
        context.fill()
      })
      animationId = window.requestAnimationFrame(update)
    }

    resize()
    update()
    window.addEventListener('resize', resize)

    return () => {
      window.cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [density])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[45] h-screen w-screen" aria-hidden />
}
