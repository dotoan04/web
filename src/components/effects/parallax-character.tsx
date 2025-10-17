'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

type ParallaxCharacterProps = {
  imageUrl: string
}

export function ParallaxCharacter({ imageUrl }: ParallaxCharacterProps) {
  const [offsetY, setOffsetY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.pageYOffset)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div 
      className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block"
      style={{
        transform: `translateY(${offsetY * 0.5}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      <div className="absolute bottom-0 right-0 h-full w-auto opacity-30 dark:opacity-20">
        <Image
          src={imageUrl}
          alt="Parallax character"
          width={600}
          height={800}
          className="h-full w-auto object-contain object-bottom"
          priority
          draggable={false}
        />
      </div>
    </div>
  )
}

