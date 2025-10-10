"use client"

import { useEffect } from 'react'

const CodeBlockClient = () => {
  useEffect(() => {
    const handler = async (event: Event) => {
      const target = event.target as HTMLElement
      if (!target || !target.closest) return
      const button = target.closest<HTMLButtonElement>('button.code-block__copy')
      if (!button) return
      const figure = button.closest('figure.code-block')
      const code = figure?.querySelector('pre code')?.textContent
      if (!code) return

      try {
        await navigator.clipboard.writeText(code)
        const previousLabel = button.textContent ?? ''
        button.textContent = 'Đã sao chép'
        button.disabled = true
        setTimeout(() => {
          button.textContent = previousLabel
          button.disabled = false
        }, 1600)
      } catch (error) {
        console.error('Copy failed', error)
      }
    }

    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return null
}

export default CodeBlockClient
export { CodeBlockClient }
