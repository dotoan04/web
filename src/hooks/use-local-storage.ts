import { useEffect, useState } from 'react'

type UseLocalStorageOptions<T> = {
  defaultValue: T
  serializer?: (value: T) => string
  parser?: (value: string) => T
}

export const useLocalStorage = <T,>(key: string, options: UseLocalStorageOptions<T>) => {
  const { defaultValue, serializer = JSON.stringify, parser = JSON.parse } = options

  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const stored = window.localStorage.getItem(key)
      return stored ? (parser(stored) as T) : defaultValue
    } catch (error) {
      console.warn('Không thể đọc localStorage:', error)
      return defaultValue
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, serializer(value))
    } catch (error) {
      console.warn('Không thể ghi localStorage:', error)
    }
  }, [key, parser, serializer, value])

  const remove = () => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.warn('Không thể xoá localStorage:', error)
    }
  }

  return [value, setValue, remove] as const
}
