'use client'

import NextImage, { type ImageProps } from 'next/image'
import { memo, useState } from 'react'

const DEFAULT_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iODAiIGZpbGw9IiNmNGYyZWMiLz48cmVjdCB4PSIxMCIgeT0iMTIiIHdpZHRoPSI4MCIgaGVpZ2h0PSI1NiIgZmlsbD0iI2Q4Y2JiNCIgZmlsbC1vcGFjaXR5PSIwLjYiLz48L3N2Zz4='

type SmartImageProps = ImageProps & {
  blurFallback?: string
  showLoadingState?: boolean
}

const SmartImageComponent = ({
  placeholder = 'blur',
  blurDataURL,
  blurFallback = DEFAULT_BLUR_DATA_URL,
  showLoadingState = false,
  className = '',
  onLoad,
  ...props
}: SmartImageProps) => {
  const [isLoading, setIsLoading] = useState(showLoadingState)

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false)
    onLoad?.(e)
  }

  // Derive safe flags from src
  const srcString = typeof props.src === 'string' ? props.src : ''
  const isDataLike = srcString.startsWith('data:') || srcString.startsWith('blob:')
  const isHttp = srcString.startsWith('http://') || srcString.startsWith('https://')
  // If src is data/blob or a possibly non-whitelisted remote host, disable optimization
  const computedUnoptimized = isDataLike || isHttp

  if (!props.src || (typeof props.src === 'string' && props.src.trim() === '')) {
    return null
  }

  return (
    <>
      <NextImage
        placeholder={placeholder}
        blurDataURL={placeholder === 'blur' ? blurDataURL ?? blurFallback : undefined}
        className={`${className} ${isLoading ? 'blur-sm scale-110' : 'blur-0 scale-100'} transition-all duration-700`}
        onLoad={handleLoad}
        loading="lazy"
        unoptimized={computedUnoptimized}
        {...props}
      />
      {isLoading && showLoadingState && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-100/50 dark:bg-ink-800/50 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink-200 border-t-indigo-600 dark:border-ink-700 dark:border-t-indigo-400" />
        </div>
      )}
    </>
  )
}

export const SmartImage = memo(SmartImageComponent)
