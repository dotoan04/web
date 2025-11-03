import JSZip from 'jszip'
import { DOMParser } from '@xmldom/xmldom'

const WORD_MAIN = 'word/document.xml'
const WORD_FOOTNOTES = 'word/footnotes.xml'
const WORD_RELS = 'word/_rels/document.xml.rels'

const NS = {
  w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
}

const BLACK_VALUES = new Set(['000000', 'auto'])

type ImageData = {
  id: string
  data: Uint8Array
  extension: string
}

type ParagraphEntry = {
  text: string
  isColored: boolean
  numId: string | null
  ilvl: string | null
  imageId?: string | null  // Can be either relId or base64 URL
}

type ParsedQuestion = {
  id: string
  raw: string
  title: string
  imageUrl?: string
  options: Array<{ key: string; value: string; isCorrect: boolean; imageUrl?: string }>
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

const getImageId = (element: Element): string | null => {
  // Check for inline images
  const inline = element.getElementsByTagNameNS(NS.w, 'drawing')[0]
  if (inline) {
    const blips = inline.getElementsByTagNameNS(NS.a, 'blip')
    if (blips.length > 0) {
      const blip = blips[0]
      const embed = blip.getAttributeNS(NS.r, 'embed')
      return embed || null
    }
  }

  // Check for anchored images
  const anchor = element.getElementsByTagNameNS(NS.w, 'anchor')[0]
  if (anchor) {
    const blips = anchor.getElementsByTagNameNS(NS.a, 'blip')
    if (blips.length > 0) {
      const blip = blips[0]
      const embed = blip.getAttributeNS(NS.r, 'embed')
      return embed || null
    }
  }

  return null
}

const parseRelationships = (relsXml: string): Map<string, string> => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(relsXml, 'application/xml')
  const relationships = Array.from(doc.getElementsByTagName('Relationship'))
  const map = new Map<string, string>()

  relationships.forEach((rel) => {
    const id = rel.getAttribute('Id')
    const target = rel.getAttribute('Target')
    const type = rel.getAttribute('Type') || ''

    if (id && target && type.includes('image')) {
      map.set(id, target)
    }
  })

  return map
}

const convertImageToBase64 = (imageData: Uint8Array, extension: string): string => {
  const base64 = Buffer.from(imageData).toString('base64')
  const mimeType = extension === 'png' ? 'image/png' : 
                   extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' :
                   extension === 'gif' ? 'image/gif' :
                   extension === 'webp' ? 'image/webp' : 'image/png'
  return `data:${mimeType};base64,${base64}`
}

const extractParagraphs = async (xml: string, relsMap?: Map<string, string>, zip?: JSZip): Promise<ParagraphEntry[]> => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')
  const paragraphs = Array.from(doc.getElementsByTagNameNS(NS.w, 'p'))
  const entries: ParagraphEntry[] = []

  // Load images from zip if available
  const imageCache = new Map<string, string>()
  if (relsMap && zip) {
    for (const [relId, target] of relsMap.entries()) {
      const imagePath = `word/${target}`
      if (zip.files[imagePath]) {
        try {
          const imageData = await zip.files[imagePath].async('uint8array')
          const extension = target.split('.').pop()?.toLowerCase() || 'png'
          const base64Url = convertImageToBase64(imageData, extension)
          imageCache.set(relId, base64Url)
        } catch (error) {
          console.error(`Failed to load image ${imagePath}:`, error)
        }
      }
    }
  }

  paragraphs.forEach((paragraph) => {
    let buffer = ''
    let isColored = false
    let currentNumId: string | null = null
    let currentIlvl: string | null = null
    let imageId: string | null = null

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
      if (text || imageId) {
        // Convert imageId to base64 URL if available in cache
        const imageUrl = imageId && imageCache.has(imageId) ? imageCache.get(imageId)! : (imageId || undefined)
        entries.push({ text, isColored, numId: currentNumId, ilvl: currentIlvl, imageId: imageUrl })
      }
      buffer = ''
      isColored = false
      imageId = null
    }

    Array.from(paragraph.childNodes).forEach((node) => {
      if (node.nodeType !== 1) return
      const element = node as Element

      if (element.localName === 'r') {
        const run = element
        const textNodes = Array.from(run.getElementsByTagNameNS(NS.w, 't'))

        // Check for images in this run
        const currentImageId = getImageId(run)
        if (currentImageId) {
          imageId = currentImageId
        }

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
      } else if (element.localName === 'pict') {
        // Legacy OLE format images
        const v = element.getElementsByTagName('v:imagedata')[0]
        if (v) {
          const rId = v.getAttribute('r:id') || v.getAttribute('r:embed')
          if (rId) {
            imageId = rId
            flush()
          }
        }
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
  
  let relsMap = new Map<string, string>()
  if (zip.files[WORD_RELS]) {
    const relsXml = await zip.files[WORD_RELS].async('string')
    relsMap = parseRelationships(relsXml)
  }

  let paragraphs = await extractParagraphs(mainXml, relsMap, zip)

  if (zip.files[WORD_FOOTNOTES]) {
    const footXml = await zip.files[WORD_FOOTNOTES].async('string')
    paragraphs = paragraphs.concat(await extractParagraphs(footXml, relsMap, zip))
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
  const trueFalsePattern = /^(Đúng|Sai)$/i

  const markCorrect = (value: string, colored: boolean) => {
    if (colored) return true
    return value.startsWith('*')
  }

  const stripMarker = (value: string) => value.replace(/^\*/g, '').trim()

  lines.forEach((entry, index) => {
    const { text, isColored, numId, ilvl, imageId } = entry
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
        imageUrl: imageId || undefined,
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
      current.options.push({ key: key.trim(), value, isCorrect, imageUrl: imageId || undefined })
      return
    }

    // Support for True/False questions
    const trueFalseMatch = trimmed.match(trueFalsePattern)
    if (trueFalseMatch && current && current.options.length < 2) {
      const key = current.options.length === 0 ? 'A' : 'B'
      const isCorrect = markCorrect(trimmed, isColored)
      current.options.push({ key, value: trimmed, isCorrect, imageUrl: imageId || undefined })
      return
    }

    if (current && numId) {
      const existingKeys = current.options.length
      const key = String.fromCharCode(65 + existingKeys)
      const isCorrect = markCorrect(trimmed, isColored)
      const value = stripMarker(trimmed)
      current.options.push({ key, value, isCorrect, imageUrl: imageId || undefined })
      return
    }

    if (current) {
      if (labelPattern.test(trimmed)) {
        current.multi = true
        return
      }

      // Handle image in question title
      if (imageId && current.options.length === 0) {
        current.imageUrl = imageId
        if (trimmed) {
          current.title = `${current.title} ${trimmed}`.trim()
        }
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
        // Handle image in option
        if (imageId) {
          last.imageUrl = imageId
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
  imageUrl?: string
  options: Array<{
    id: string
    text: string
    isCorrect: boolean
    order: number
    imageUrl?: string
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
    imageUrl: question.imageUrl,
    options: question.options.map((option, index) => ({
      id: `${question.id}-option-${index}`,
      text: option.value,
      isCorrect: option.isCorrect,
      order: index,
      imageUrl: option.imageUrl,
    })),
    multi: question.multi,
  }))
