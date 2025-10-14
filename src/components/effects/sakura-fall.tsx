'use client'

import { useEffect, useRef } from 'react'

type SakuraFallProps = {
  density?: number
}

type Petal = {
  x: number
  y: number
  size: number
  speed: number
  sway: number
  drift: number
  rotation: number
  spin: number
}

const DEFAULT_COUNT = 55

const createPetal = (width: number, height: number): Petal => ({
  x: Math.random() * width,
  y: Math.random() * height,
  size: 12 + Math.random() * 18,
  speed: 0.6 + Math.random() * 0.9,
  sway: 0.3 + Math.random() * 0.6,
  drift: (Math.random() - 0.5) * 0.8,
  rotation: Math.random() * Math.PI * 2,
  spin: (Math.random() - 0.5) * 0.02,
})

const drawPetal = (context: CanvasRenderingContext2D, petal: Petal) => {
  const gradient = context.createLinearGradient(0, 0, 0, petal.size)
  gradient.addColorStop(0, 'rgba(255, 209, 220, 0.8)')
  gradient.addColorStop(1, 'rgba(255, 158, 190, 0.95)')

  context.save()
  context.translate(petal.x, petal.y)
  context.rotate(petal.rotation)
  context.scale(1, 0.75)
  context.beginPath()
  context.moveTo(0, 0)
  context.quadraticCurveTo(petal.size * 0.5, -petal.size * 0.2, petal.size * 0.4, -petal.size)
  context.quadraticCurveTo(0, -petal.size * 0.6, -petal.size * 0.4, -petal.size)
  context.quadraticCurveTo(-petal.size * 0.5, -petal.size * 0.2, 0, 0)
  context.fillStyle = gradient
  context.fill()
  context.restore()
}

export const SakuraFall = ({ density = 1 }: SakuraFallProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const petals: Petal[] = []
    let width = window.innerWidth
    let height = window.innerHeight
    let animationId = 0

    const targetCount = Math.max(24, Math.round(DEFAULT_COUNT * density))

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      if (petals.length === 0) {
        for (let index = 0; index < targetCount; index += 1) {
          petals.push(createPetal(width, height))
        }
      }
    }

    const update = () => {
      context.clearRect(0, 0, width, height)

      petals.forEach((petal, index) => {
        petal.y += petal.speed
        petal.x += Math.sin((petal.y / height) * Math.PI * 2) * petal.sway + petal.drift
        petal.rotation += petal.spin

        if (petal.y > height + petal.size) {
          petals[index] = createPetal(width, 0)
          petals[index].y = -petal.size
        }

        if (petal.x > width + petal.size) {
          petals[index].x = -petal.size
        } else if (petal.x < -petal.size) {
          petals[index].x = width + petal.size
        }

        drawPetal(context, petal)
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

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[44] h-screen w-screen" aria-hidden />
}
