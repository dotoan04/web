import NextImage, { type ImageProps } from 'next/image'

const DEFAULT_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iODAiIGZpbGw9IiNmNGYyZWMiLz48cmVjdCB4PSIxMCIgeT0iMTIiIHdpZHRoPSI4MCIgaGVpZ2h0PSI1NiIgZmlsbD0iI2Q4Y2JiNCIgZmlsbC1vcGFjaXR5PSIwLjYiLz48L3N2Zz4='

type SmartImageProps = ImageProps & {
  blurFallback?: string
}

export const SmartImage = ({
  placeholder = 'blur',
  blurDataURL,
  blurFallback = DEFAULT_BLUR_DATA_URL,
  ...props
}: SmartImageProps) => (
  <NextImage
    placeholder={placeholder}
    blurDataURL={placeholder === 'blur' ? blurDataURL ?? blurFallback : undefined}
    {...props}
  />
)
