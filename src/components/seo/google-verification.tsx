/**
 * Google Site Verification Component
 * 
 * Cách sử dụng:
 * 1. Lấy verification code từ Google Search Console
 * 2. Thêm vào .env hoặc .env.local:
 *    NEXT_PUBLIC_GOOGLE_VERIFICATION="your_code_here"
 * 3. Component này sẽ tự động render meta tag
 */

export function GoogleVerification() {
  const verificationCode = process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION

  if (!verificationCode) {
    return null
  }

  return (
    <meta name="google-site-verification" content={verificationCode} />
  )
}
