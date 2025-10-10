"use client"

import { useEffect } from 'react'

const isEnabled = process.env.NEXT_PUBLIC_ENABLE_PWA !== 'false'

export const PwaRegister = () => {
  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        if (process.env.NODE_ENV === 'development') {
          console.info('Service worker registered', registration.scope)
        }
      } catch (error) {
        console.error('Service worker registration failed', error)
      }
    }

    void register()

    return () => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          if (registration.scope.includes(window.location.origin)) {
            registration.update().catch(() => {})
          }
        })
      })
    }
  }, [])

  return null
}
