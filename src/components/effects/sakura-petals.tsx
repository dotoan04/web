'use client'

import { useEffect, useRef } from 'react'

interface Petal {
  id: number
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  rotation: number
  rotationSpeed: number
  opacity: number
  swayAmount: number
  swaySpeed: number
  time: number
}

export function SakuraPetals() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const petalsRef = useRef<Petal[]>([])
  const animationRef = useRef<number>()
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Create initial petals
    const createPetal = (id: number): Petal => ({
      id,
      x: Math.random() * canvas.width,
      y: -20,
      size: Math.random() * 15 + 8,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: Math.random() * 1.2 + 0.8,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.04,
      opacity: Math.random() * 0.4 + 0.3,
      swayAmount: Math.random() * 30 + 20,
      swaySpeed: Math.random() * 0.003 + 0.002,
      time: Math.random() * Math.PI * 2,
    })

    // Initialize petals
    for (let i = 0; i < 15; i++) {
      const petal = createPetal(i)
      petal.y = Math.random() * canvas.height // Distribute initially
      petalsRef.current.push(petal)
    }

    const drawPetal = (ctx: CanvasRenderingContext2D, petal: Petal) => {
      ctx.save()
      
      ctx.globalAlpha = petal.opacity
      ctx.translate(petal.x, petal.y)
      ctx.rotate(petal.rotation)
      
      // Draw petal shape using bezier curves
      ctx.beginPath()
      ctx.moveTo(0, 0)
      
      // Create petal with gradient
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, petal.size)
      gradient.addColorStop(0, 'rgba(255, 182, 193, 0.9)')
      gradient.addColorStop(0.5, 'rgba(255, 192, 203, 0.7)')
      gradient.addColorStop(1, 'rgba(255, 228, 225, 0.3)')
      
      ctx.fillStyle = gradient
      
      // Draw a more realistic petal shape
      ctx.ellipse(0, 0, petal.size * 0.4, petal.size, 0, 0, Math.PI * 2)
      ctx.fill()
      
      // Add subtle shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetY = 2
      ctx.fill()
      
      ctx.restore()
    }

    const animate = () => {
      if (!ctx || !canvas) return
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      timeRef.current += 0.016 // ~60fps

      // Update and draw petals
      petalsRef.current.forEach((petal, index) => {
        // Update position with swaying motion
        const swayX = Math.sin(petal.time * petal.swaySpeed) * petal.swayAmount
        petal.x += petal.speedX + swayX * 0.01
        petal.y += petal.speedY
        petal.rotation += petal.rotationSpeed
        petal.time += 0.016

        // Reset petal if it goes off screen
        if (petal.y > canvas.height + 20) {
          petalsRef.current[index] = createPetal(petal.id)
        }
        if (petal.x < -30) {
          petal.x = canvas.width + 30
        } else if (petal.x > canvas.width + 30) {
          petal.x = -30
        }

        drawPetal(ctx, petal)
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'multiply' }}
    />
  )
}
