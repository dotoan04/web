import { generateHTML } from '@tiptap/html'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import StarterKit from '@tiptap/starter-kit'
import { load } from 'cheerio/slim'
import type { Highlighter } from 'shiki'

import { findLanguageLabel } from '@/lib/code-languages'
import { slugify } from '@/lib/utils'

export type HeadingItem = {
  id: string
  text: string
  level: number
}

const CODE_LANG_SET = new Set(['plaintext', 'typescript', 'javascript', 'tsx', 'jsx', 'json', 'bash', 'python', 'go', 'rust'])

const getSafeLanguage = (language?: string) => {
  if (!language) return 'plaintext'
  const normalized = language.toLowerCase().replace('language-', '')
  if (CODE_LANG_SET.has(normalized)) return normalized
  if (normalized === 'js') return 'javascript'
  if (normalized === 'ts') return 'typescript'
  return 'plaintext'
}

const parseHighlightLines = (value?: string) => {
  const result = new Set<number>()
  if (!value) return result
  value
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .forEach((segment) => {
      if (segment.includes('-')) {
        const [start, end] = segment.split('-').map((num) => Number.parseInt(num.trim(), 10))
        if (!Number.isNaN(start) && !Number.isNaN(end)) {
          for (let line = Math.min(start, end); line <= Math.max(start, end); line += 1) {
            result.add(line)
          }
        }
      } else {
        const line = Number.parseInt(segment, 10)
        if (!Number.isNaN(line)) result.add(line)
      }
    })
  return result
}

let highlighterPromise: Promise<Highlighter> | null = null

const getHighlighterInstance = () => {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(({ createHighlighter }) =>
      createHighlighter({
        themes: ['github-light', 'poimandres'],
        langs: Array.from(CODE_LANG_SET),
      })
    )
  }
  return highlighterPromise
}

export const renderRichText = async (content: Record<string, unknown>) => {
  const raw = generateHTML(content, [
    StarterKit.configure({
      link: false,
    }),
    Link.configure({
      HTMLAttributes: {
        class: 'text-ink-700 underline decoration-ink-300 underline-offset-4 hover:text-ink-900 dark:text-ink-200 dark:hover:text-ink-100',
      },
    }),
    Image.configure({ HTMLAttributes: { class: 'my-10 w-full rounded-3xl shadow-lg' } }),
  ])

  const $ = load(raw, { decodeEntities: false } as any)
  const headings: HeadingItem[] = []
  const seen = new Map<string, number>()

  $('h2, h3, h4').each((_, element) => {
    const el = $(element)
    el.find('.heading-anchor').remove()
    const text = el.text().trim()
    if (!text) return
    const level = Number(element.tagName?.replace('h', '') ?? 2)
    let slug = slugify(text)
    if (!slug) slug = `muc-${headings.length + 1}`
    const count = seen.get(slug) ?? 0
    const id = count ? `${slug}-${count + 1}` : slug
    seen.set(slug, count + 1)
    el.attr('id', id)
    el.append(`<a class="heading-anchor" href="#${id}" aria-hidden="true">#</a>`)
    headings.push({ id, text, level })
  })

  const codeBlocks = $('pre code').toArray()
  if (codeBlocks.length > 0) {
    const highlighter = await getHighlighterInstance()
    for (const element of codeBlocks) {
      const codeElement = $(element)
      const preElement = codeElement.parent()
      const languageAttr = codeElement.attr('data-language') || preElement.attr('data-language') || codeElement.attr('class')
      const highlightAttr = codeElement.attr('data-highlight') || preElement.attr('data-highlight') || ''
      const language = getSafeLanguage(languageAttr)
      const code = codeElement.text().replace(/\u0000/g, '')
      const highlighted = highlighter.codeToHtml(code, {
        lang: language,
        themes: { light: 'github-light', dark: 'poimandres' },
      })
      const snippet = load(highlighted, { decodeEntities: false } as any)
      const pre = snippet('pre')
      const highlightLines = parseHighlightLines(highlightAttr)
      if (highlightLines.size > 0) {
        pre.attr('data-highlight', highlightAttr)
      }
      pre.attr('data-language', language)
      pre.find('.line').each((index, line) => {
        const lineNumber = index + 1
        if (highlightLines.has(lineNumber)) {
          snippet(line).attr('data-highlighted', 'true')
        }
      })
      const preHtml = pre.toString()
      const languageLabel = findLanguageLabel(language)
      const toolbar = `<div class="code-block__toolbar"><span class="code-block__language">${languageLabel.toUpperCase()}</span><button type="button" class="code-block__copy" data-copy aria-label="Sao chép đoạn mã">Sao chép</button></div>`
      const figureHtml = `<figure class="code-block" data-language="${languageLabel}">${toolbar}${preHtml}</figure>`
      preElement.replaceWith(figureHtml)
    }
  }

  return { html: $.root().html() ?? raw, headings }
}
