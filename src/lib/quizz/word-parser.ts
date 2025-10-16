import JSZip from 'jszip'
import { DOMParser } from '@xmldom/xmldom'

const WORD_MAIN = 'word/document.xml'
const WORD_FOOTNOTES = 'word/footnotes.xml'

const NS = {
  w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
}

const BLACK_VALUES = new Set(['000000', 'auto'])

type ParagraphEntry = {
  text: string
  isColored: boolean
  numId: string | null
  ilvl: string | null
}

type ParsedQuestion = {
  id: string
  raw: string
  title: string
  options: Array<{ key: string; value: string; isCorrect: boolean }>
  correct: Set<number>
  multi: boolean
}

const getColorValue = (run: Element) => {
  const colorNode = run.getElementsByTagNameNS(NS.w, 'color')[0]
  if (!colorNode) return null
  const val =
    colorNode.getAttributeNS(NS.w, 'val') ||
    colorNode.getAttribute('w:val') ||
    colorNode.getAttribute('val')
  return val ? val.toLowerCase() : null
}

const extractParagraphs = (xml: string) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')
  const paragraphs = Array.from(doc.getElementsByTagNameNS(NS.w, 'p'))
  const entries: ParagraphEntry[] = []

  paragraphs.forEach((paragraph) => {
    let buffer = ''
    let isColored = false
    let currentNumId: string | null = null
    let currentIlvl: string | null = null

    const pPr = Array.from(paragraph.childNodes).find(
      (node) => node.nodeType === 1 && (node as Element).localName === 'pPr',
    ) as Element | undefined

    if (pPr) {
      const numPr = Array.from(pPr.childNodes).find(
        (node) => node.nodeType === 1 && (node as Element).localName === 'numPr',
      ) as Element | undefined

      if (numPr) {
        const numIdNode = Array.from(numPr.childNodes).find(
          (node) => node.nodeType === 1 && (node as Element).localName === 'numId',
        ) as Element | undefined

        const ilvlNode = Array.from(numPr.childNodes).find(
          (node) => node.nodeType === 1 && (node as Element).localName === 'ilvl',
        ) as Element | undefined

        if (numIdNode) {
          currentNumId =
            numIdNode.getAttributeNS(NS.w, 'val') ||
            numIdNode.getAttribute('w:val') ||
            numIdNode.getAttribute('val')
        }

        if (ilvlNode) {
          currentIlvl =
            ilvlNode.getAttributeNS(NS.w, 'val') ||
            ilvlNode.getAttribute('w:val') ||
            ilvlNode.getAttribute('val')
        }
      }
    }

    const flush = () => {
      const text = buffer.replace(/\u00A0/g, ' ').trim()
      if (text) {
        entries.push({ text, isColored, numId: currentNumId, ilvl: currentIlvl })
      }
      buffer = ''
      isColored = false
    }

    Array.from(paragraph.childNodes).forEach((node) => {
      if (node.nodeType !== 1) return
      const element = node as Element

      if (element.localName === 'r') {
        const run = element
        const textNodes = Array.from(run.getElementsByTagNameNS(NS.w, 't'))

        textNodes.forEach((child, index) => {
          const value = child.textContent || ''
          if (value) {
            buffer += value
          }

          const hasTrailingBreak =
            index === textNodes.length - 1 &&
            (run.getElementsByTagNameNS(NS.w, 'br').length > 0 ||
              run.getElementsByTagNameNS(NS.w, 'cr').length > 0)

          if (hasTrailingBreak) {
            flush()
          }
        })

        const colorValue = getColorValue(run)
        if (colorValue && !BLACK_VALUES.has(colorValue)) {
          isColored = true
        }
      } else if (element.localName === 'br' || element.localName === 'cr') {
        flush()
      }
    })

    flush()
  })

  return entries
}

const parseDocxFile = async (buffer: ArrayBuffer) => {
  const zip = await JSZip.loadAsync(buffer)

  if (!zip.files[WORD_MAIN]) {
    throw new Error('Tệp DOCX không hợp lệ.')
  }

  const mainXml = await zip.files[WORD_MAIN].async('string')
  let paragraphs = extractParagraphs(mainXml)

  if (zip.files[WORD_FOOTNOTES]) {
    const footXml = await zip.files[WORD_FOOTNOTES].async('string')
    paragraphs = paragraphs.concat(extractParagraphs(footXml))
  }

  return paragraphs
}

const parsePlainText = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ text: line, isColored: false, numId: null, ilvl: null }))

const groupQuestions = (lines: ParagraphEntry[]): ParsedQuestion[] => {
  const items: ParsedQuestion[] = []
  let current: ParsedQuestion | null = null

  const questionPattern = /^(Câu\s+\d+\s*[:\.\-]?)(.*)$/i
  const optionPattern = /^([A-DĐ])\.\s*(.*)$/i
  const labelPattern = /^(Chọn\s*\d+\s*(?:đáp\s*án|phương\s*án)\s*đúng)/i
  const multiPattern = /(Chọn\s*\d+\s*đáp\s*án\s*đúng|Chọn\s*\d+\s*phương\s*án)/i

  const markCorrect = (value: string, colored: boolean) => {
    if (colored) return true
    return value.startsWith('*')
  }

  const stripMarker = (value: string) => value.replace(/^\*/g, '').trim()

  lines.forEach((entry, index) => {
    const { text, isColored, numId, ilvl } = entry
    const trimmed = text.trim()

    const questionMatch = trimmed.match(questionPattern)
    if (questionMatch) {
      if (current) {
        items.push(current)
      }

      const [, prefix, rest] = questionMatch
      const title = (rest || prefix).trim()

      current = {
        id: `q-${items.length + 1}`,
        raw: text,
        title,
        options: [],
        correct: new Set<number>(),
        multi: multiPattern.test(text),
      }
      return
    }

    const optionMatch = trimmed.match(optionPattern)
    if (optionMatch && current) {
      const [, key, rest] = optionMatch
      const original = rest.trim()
      const isCorrect = markCorrect(original, isColored)
      const value = stripMarker(original)
      current.options.push({ key: key.trim(), value, isCorrect })
      return
    }

    if (current && numId) {
      const existingKeys = current.options.length
      const key = String.fromCharCode(65 + existingKeys)
      const isCorrect = markCorrect(trimmed, isColored)
      const value = stripMarker(trimmed)
      current.options.push({ key, value, isCorrect })
      return
    }

    if (current) {
      if (labelPattern.test(trimmed)) {
        current.multi = true
        return
      }

      if (current.options.length === 0) {
        current.title = `${current.title} ${trimmed}`.trim()
      } else {
        const last = current.options[current.options.length - 1]
        const updatedValue = `${last.value} ${trimmed}`.trim()
        last.value = stripMarker(updatedValue)
        if (markCorrect(updatedValue, isColored)) {
          last.isCorrect = true
        }
      }
    }
  })

  if (current) {
    items.push(current)
  }

  items.forEach((question) => {
    question.options.forEach((option, index) => {
      if (option.isCorrect) {
        question.correct.add(index)
      }
    })
    if (question.correct.size > 1) {
      question.multi = true
    }
  })

  return items.filter((item) => item.options.length >= 2)
}

export type ParsedQuizQuestion = ReturnType<typeof groupQuestions>

export type SanitizedQuizQuestion = {
  id: string
  title: string
  options: Array<{
    id: string
    text: string
    isCorrect: boolean
    order: number
  }>
  multi: boolean
}

export const parseQuizContent = async (input: { buffer?: ArrayBuffer; text?: string }) => {
  let lines: ParagraphEntry[] = []

  if (input.buffer) {
    lines = await parseDocxFile(input.buffer)
  }

  if ((!lines || lines.length === 0) && input.text) {
    lines = parsePlainText(input.text)
  }

  if (!lines || lines.length === 0) {
    throw new Error('Không tìm thấy nội dung để phân tích.')
  }

  return groupQuestions(lines)
}

export const sanitizeParsedQuestions = (questions: ParsedQuizQuestion): SanitizedQuizQuestion[] =>
  questions.map((question) => ({
    id: question.id,
    title: question.title,
    options: question.options.map((option, index) => ({
      id: `${question.id}-option-${index}`,
      text: option.value,
      isCorrect: option.isCorrect,
      order: index,
    })),
    multi: question.multi,
  }))
