import { S3Client } from '@aws-sdk/client-s3'

export const getSpacesClient = () => {
  const endpoint = process.env.SPACES_ENDPOINT
  const region = process.env.SPACES_REGION || 'ap-southeast-1'
  const accessKeyId = process.env.SPACES_KEY_ID
  const secretAccessKey = process.env.SPACES_SECRET

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('SPACES configuration missing. Please set SPACES_ENDPOINT, SPACES_KEY_ID, SPACES_SECRET.')
  }

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: false,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export const getSpacesPublicBaseUrl = () => {
  const publicBase = process.env.SPACES_PUBLIC_BASE_URL || process.env.SPACES_ENDPOINT
  if (!publicBase) throw new Error('SPACES_PUBLIC_BASE_URL or SPACES_ENDPOINT must be set')
  return publicBase.replace(/\/$/, '')
}


