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
// Red color values commonly used in Word documents (in hex, without #)
const RED_COLORS = new Set([
  'ff0000', 'ff0001', 'ff0002', 'ff0003', 'ff0004', 'ff0005', // Various shades of red
  'dc143c', 'crimson', 'b22222', '8b0000', 'a52a2a', // More red variants
  'ff0033', 'ff3333', 'cc0000', '990000', // Red variations
])

type ImageData = {
  id: string
  data: Uint8Array
  extension: string
}

type ParagraphEntry = {
  text: string
  isColored: boolean
  isRed: boolean  // Specifically track if text is red
  numId: string | null
  ilvl: string | null
  imageId?: string | null  // Can be either relId or base64 URL
}

type ParsedQuestion = {
  id: string
  raw: string
  title: string
  content: string  // Content/body for theory questions
  imageUrl?: string
  options: Array<{ key: string; value: string; isCorrect: boolean; imageUrl?: string }>
  correct: Set<number>
  multi: boolean
  type?: 'matching' | 'truefalse' | 'regular' | 'fill_in_blank'
}

const getColorValue = (run: Element) => {
  const colorNode = run.getElementsByTagNameNS(NS.w, 'color')[0]
  if (!colorNode) return null
  const val =
    colorNode.getAttributeNS(NS.w, 'val') ||
    colorNode.getAttribute('w:val') ||
    colorNode.getAttribute('val')
  return val ? val.toLowerCase().replace('#', '') : null
}

const isRedColor = (colorValue: string | null): boolean => {
  if (!colorValue) return false
  const normalized = colorValue.toLowerCase().replace('#', '').trim()
  // Check if it's a red color
  return RED_COLORS.has(normalized) || 
         (normalized.startsWith('ff') && normalized.length === 6) || // Starts with FF (high red component)
         normalized === 'red'
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
  try {
    // Ensure we have valid image data
    if (!imageData || imageData.length === 0) {
      throw new Error('Image data is empty')
    }

    // Convert Uint8Array to Buffer properly
    // Handle both Uint8Array and regular array
    let buffer: Buffer
    try {
      buffer = Buffer.isBuffer(imageData)
        ? imageData
        : Buffer.from(imageData.buffer, imageData.byteOffset, imageData.byteLength)
    } catch (bufferError) {
      // Fallback for problematic imageData
      console.warn('Using fallback buffer conversion method')
      buffer = Buffer.from(imageData)
    }
    
    const base64 = buffer.toString('base64')
    
    // Normalize extension and determine mime type
    const normalizedExt = extension.toLowerCase().replace(/^\./, '').trim()
    let mimeType = 'image/png' // default
    
    if (normalizedExt === 'png') {
      mimeType = 'image/png'
    } else if (normalizedExt === 'jpg' || normalizedExt === 'jpeg') {
      mimeType = 'image/jpeg'
    } else if (normalizedExt === 'gif') {
      mimeType = 'image/gif'
    } else if (normalizedExt === 'webp') {
      mimeType = 'image/webp'
    } else if (normalizedExt === 'bmp') {
      mimeType = 'image/bmp'
    } else if (normalizedExt === 'svg') {
      mimeType = 'image/svg+xml'
    }
    
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error('Error converting image to base64:', error)
    throw new Error(`Không thể xử lý ảnh: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`)
  }
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
      
      // Check if file exists and is not a directory
      const zipFile = zip.files[imagePath]
      if (!zipFile || zipFile.dir) {
        continue
      }
      
      try {
        // Read image data as Uint8Array
        const imageData = await zipFile.async('uint8array')
        
        // Validate image data
        if (!imageData || imageData.length === 0) {
          console.warn(`Image ${imagePath} is empty, skipping`)
          continue
        }
        
        // Additional validation for corrupted images
        if (imageData.length < 100) {
          console.warn(`Image ${imagePath} seems too small (${imageData.length} bytes), might be corrupted`)
          // Still try to process it, but warn
        }
        
        // Extract extension from target path
        // Handle cases where target might be like "media/image1.png" or just "image1"
        const pathParts = target.split('/')
        const filename = pathParts[pathParts.length - 1] || target
        const extension = filename.includes('.') 
          ? filename.split('.').pop()?.toLowerCase() || 'png'
          : 'png'
        
        // Detect image type from file signature if extension is missing or invalid
        let detectedExtension = extension
        if (imageData.length >= 3) {
          // Get first few bytes for signature detection
          const firstBytes = Array.from(imageData.slice(0, Math.min(12, imageData.length)))
          
          // PNG signature: 89 50 4E 47
          if (firstBytes[0] === 0x89 && firstBytes[1] === 0x50 && firstBytes[2] === 0x4E && firstBytes[3] === 0x47) {
            detectedExtension = 'png'
          } 
          // JPEG signature: FF D8 FF
          else if (firstBytes[0] === 0xFF && firstBytes[1] === 0xD8 && firstBytes[2] === 0xFF) {
            detectedExtension = 'jpeg'
          } 
          // GIF signature: 47 49 46 38 (GIF8)
          else if (firstBytes[0] === 0x47 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46 && firstBytes[3] === 0x38) {
            detectedExtension = 'gif'
          } 
          // RIFF signature: 52 49 46 46 (could be WebP)
          else if (firstBytes[0] === 0x52 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46 && firstBytes[3] === 0x46) {
            // Check if it's WebP (RIFF....WEBP)
            if (imageData.length >= 12) {
              const webpCheck = String.fromCharCode(...imageData.slice(8, 12))
              if (webpCheck === 'WEBP') {
                detectedExtension = 'webp'
              }
            }
          }
          // BMP signature: 42 4D
          else if (firstBytes[0] === 0x42 && firstBytes[1] === 0x4D) {
            detectedExtension = 'bmp'
          }
        }
        
        try {
          const base64Url = convertImageToBase64(imageData, detectedExtension)
          imageCache.set(relId, base64Url)
        } catch (conversionError) {
          console.error(`Failed to convert image ${imagePath} to base64:`, conversionError)
          // Continue with other images even if conversion fails
        }
      } catch (error) {
        console.error(`Failed to load image ${imagePath}:`, error)
        // Continue processing other images instead of failing completely
      }
    }
  }

  paragraphs.forEach((paragraph) => {
    let buffer = ''
    let isColored = false
    let isRed = false
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
        entries.push({ text, isColored, isRed, numId: currentNumId, ilvl: currentIlvl, imageId: imageUrl })
      }
      buffer = ''
      isColored = false
      isRed = false
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
          // Check if it's specifically red
          if (isRedColor(colorValue)) {
            isRed = true
          }
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
    .map((line) => ({ text: line, isColored: false, isRed: false, numId: null, ilvl: null }))

const groupQuestions = (lines: ParagraphEntry[]): ParsedQuestion[] => {
  const items: ParsedQuestion[] = []
  let current: ParsedQuestion | null = null
  let questionTextBuffer: string[] = [] // Buffer to collect question text before options start
  let isCollectingQuestion = false

  const questionPattern = /^(Câu\s+\d+\s*[:\.\-]?)(.*)$/i
  // More strict option pattern - must be at start of line and followed by space/dot
  const optionPattern = /^([A-DĐ])[\.\)]\s+(.+)$/i
  const labelPattern = /^(Chọn\s*\d+\s*(?:đáp\s*án|phương\s*án)\s*đúng)/i
  const multiPattern = /(Chọn\s*\d+\s*đáp\s*án\s*đúng|Chọn\s*\d+\s*phương\s*án)/i
  const trueFalsePattern = /^(Đúng|Sai|True|False)$/i
  // More flexible pattern for true/false that can handle prefixes like "A. Đúng" or "* Đúng"
  const trueFalseOptionPattern = /^(?:[A-DĐ][\.\)]\s*)?\*?\s*(Đúng|Sai|True|False)\s*$/i
  // Pattern to match option format with true/false: "A. Đúng" or "A. Sai"
  const trueFalseWithOptionPattern = /^([A-DĐ])[\.\)]\s*\*?\s*(Đúng|Sai|True|False)\s*$/i
  const numberedItemPattern = /^\d+[\.\)]\s+/  // Match "1. " or "1) "
  // Pattern to detect if a line is likely an answer option (starts with A-D followed by dot/parenthesis)
  const looksLikeOption = /^[A-DĐ][\.\)]\s/
  // Pattern to detect asterisk before option key or in text
  const asteriskPattern = /^\*\s*([A-DĐ])[\.\)]\s*(.+)$|^([A-DĐ])[\.\)]\s*\*\s*(.+)$|^([A-DĐ])[\.\)]\s+(.+)\*|^([A-DĐ])[\.\)]\s+([^\*]*\*[^\*]*)$/i

  const markCorrect = (value: string, colored: boolean, isRed: boolean) => {
    // Red text is a strong indicator of correct answer
    if (isRed) return true
    // Colored (non-black, non-red) can also indicate correct
    if (colored) return true
    // Asterisk anywhere in the text indicates correct answer
    if (value.includes('*')) return true
    // Asterisk at the start
    if (value.trim().startsWith('*')) return true
    return false
  }

  const stripMarker = (value: string) => {
    // Remove asterisks from anywhere in the text
    return value.replace(/\*+/g, '').trim()
  }

  lines.forEach((entry, index) => {
    const { text, isColored, isRed, numId, ilvl, imageId } = entry
    const trimmed = text.trim()

    const questionMatch = trimmed.match(questionPattern)
    if (questionMatch) {
      // Flush previous question
      if (current) {
        // Apply buffered question text before adding options
        if (questionTextBuffer.length > 0 && current.options.length === 0) {
          const bufferedText = questionTextBuffer.join(' ').trim()
          if (bufferedText) {
            if (current.content) {
              current.content = `${current.content}\n${bufferedText}`.trim()
            } else if (current.title.length < 200) {
              current.title = `${current.title} ${bufferedText}`.trim()
            } else {
              current.content = bufferedText
            }
          }
          questionTextBuffer = []
        }
        items.push(current)
      }

      const [, prefix, rest] = questionMatch
      const title = (rest || prefix).trim()

      current = {
        id: `q-${items.length + 1}`,
        raw: text,
        title,
        content: '',
        imageUrl: imageId || undefined,
        options: [],
        correct: new Set<number>(),
        multi: multiPattern.test(text),
      }
      questionTextBuffer = []
      isCollectingQuestion = true
      return
    }

    // Check if this looks like an option - handle asterisk patterns first
    let optionMatch = trimmed.match(asteriskPattern)
    let optionKey: string | null = null
    let optionValue: string | null = null
    let hasAsterisk = false

    if (optionMatch && current) {
      // Extract key and value from various asterisk patterns
      // Pattern 1: *A. Text
      if (optionMatch[1] && optionMatch[2]) {
        optionKey = optionMatch[1]
        optionValue = optionMatch[2]
        hasAsterisk = true
      }
      // Pattern 2: A. *Text
      else if (optionMatch[3] && optionMatch[4]) {
        optionKey = optionMatch[3]
        optionValue = optionMatch[4]
        hasAsterisk = true
      }
      // Pattern 3: A. Text*
      else if (optionMatch[5] && optionMatch[6]) {
        optionKey = optionMatch[5]
        optionValue = optionMatch[6]
        hasAsterisk = true
      }
      // Pattern 4: A. Text with * somewhere
      else if (optionMatch[7] && optionMatch[8]) {
        optionKey = optionMatch[7]
        optionValue = optionMatch[8]
        hasAsterisk = true
      }
    }

    // If no asterisk pattern matched, try regular option pattern
    if (!optionMatch || !optionKey) {
      optionMatch = trimmed.match(optionPattern)
      if (optionMatch) {
        optionKey = optionMatch[1]
        optionValue = optionMatch[2]
      }
    }

    if (optionMatch && optionKey && optionValue && current) {
      // If we were collecting question text, flush it first
      if (questionTextBuffer.length > 0 && current.options.length === 0) {
        const bufferedText = questionTextBuffer.join(' ').trim()
        if (bufferedText) {
          if (current.content) {
            current.content = `${current.content}\n${bufferedText}`.trim()
          } else if (current.title.length < 200) {
            current.title = `${current.title} ${bufferedText}`.trim()
          } else {
            current.content = bufferedText
          }
        }
        questionTextBuffer = []
      }
      isCollectingQuestion = false

      const original = optionValue.trim()
      // Check for correct answer: red text, colored text, or asterisk
      const isCorrect = markCorrect(original, isColored, isRed) || hasAsterisk
      const value = stripMarker(original)
      current.options.push({ key: optionKey.trim(), value, isCorrect, imageUrl: imageId || undefined })
      return
    }

    // Support for True/False questions - more flexible matching
    // Try pattern that handles "A. Đúng" or "* Đúng" or just "Đúng"
    let trueFalseMatch: RegExpMatchArray | null = null
    let trueFalseValue: string | null = null
    let trueFalseKey: string | null = null
    let hasTrueFalseAsterisk = false
    
    // First try pattern with option key: "A. Đúng" or "A. *Đúng" or "*A. Đúng"
    const trueFalseWithOption = trimmed.match(trueFalseWithOptionPattern)
    if (trueFalseWithOption && current) {
      trueFalseKey = trueFalseWithOption[1]
      trueFalseValue = trueFalseWithOption[2]
      hasTrueFalseAsterisk = trimmed.includes('*')
      trueFalseMatch = trueFalseWithOption
    } else {
      // Try pattern without option key but with optional asterisk: "* Đúng" or "Đúng"
      trueFalseMatch = trimmed.match(trueFalseOptionPattern)
      if (trueFalseMatch) {
        trueFalseValue = trueFalseMatch[1] // The captured group is the true/false value
        hasTrueFalseAsterisk = trimmed.includes('*')
      } else {
        // Fallback to simple pattern: just "Đúng" or "Sai"
        trueFalseMatch = trimmed.match(trueFalsePattern)
        if (trueFalseMatch) {
          trueFalseValue = trimmed.trim()
        }
      }
    }

    if (trueFalseMatch && trueFalseValue && current) {
      // Only add if we don't have 2 options yet
      if (current.options.length < 2) {
        // Flush question text buffer if needed
        if (questionTextBuffer.length > 0 && current.options.length === 0) {
          const bufferedText = questionTextBuffer.join(' ').trim()
          if (bufferedText) {
            if (current.content) {
              current.content = `${current.content}\n${bufferedText}`.trim()
            } else if (current.title.length < 200) {
              current.title = `${current.title} ${bufferedText}`.trim()
            } else {
              current.content = bufferedText
            }
          }
          questionTextBuffer = []
        }
        isCollectingQuestion = false

        // Use the key from pattern if available, otherwise assign A or B
        const key = trueFalseKey || (current.options.length === 0 ? 'A' : 'B')
        // Check for correct: red text, colored text, or asterisk in original text
        const isCorrect = markCorrect(trimmed, isColored, isRed) || hasTrueFalseAsterisk
        const cleanValue = stripMarker(trueFalseValue)
        current.options.push({ key, value: cleanValue, isCorrect, imageUrl: imageId || undefined })
        return
      }
    }

    // Handle numbered list items (1. 2. etc) as options if we're past question text
    if (current && numId && !isCollectingQuestion) {
      const existingKeys = current.options.length
      if (existingKeys < 10) { // Limit to reasonable number of options
        const key = String.fromCharCode(65 + existingKeys)
        const isCorrect = markCorrect(trimmed, isColored, isRed)
        const value = stripMarker(trimmed)
        current.options.push({ key, value, isCorrect, imageUrl: imageId || undefined })
        return
      }
    }

    if (current) {
      if (labelPattern.test(trimmed)) {
        current.multi = true
        return
      }

      // If we see something that looks like an option but wasn't matched, 
      // it might be part of question text - be more careful
      if (looksLikeOption.test(trimmed) && current.options.length === 0) {
        // This might be part of question text, not an actual option
        // Only treat as option if it's clearly formatted
        if (optionPattern.test(trimmed)) {
          // Actually is an option, process it
          const optionMatch = trimmed.match(optionPattern)
          if (optionMatch) {
          const [, key, rest] = optionMatch
          const original = rest.trim()
          const isCorrect = markCorrect(original, isColored, isRed)
          const value = stripMarker(original)
          current.options.push({ key: key.trim(), value, isCorrect, imageUrl: imageId || undefined })
          isCollectingQuestion = false
          return
          }
        }
        // Otherwise, treat as question text
      }

      // Handle images - if we have an image and no options yet, it's part of question
      if (imageId) {
        if (current.options.length === 0) {
          // Image is part of question
          if (!current.imageUrl) {
            current.imageUrl = imageId
          }
          // Add text to question buffer
          if (trimmed) {
            questionTextBuffer.push(trimmed)
          }
          return
        } else {
          // Image is part of last option
          const last = current.options[current.options.length - 1]
          if (!last.imageUrl) {
            last.imageUrl = imageId
          }
          // Continue to add text to option
        }
      }

      if (current.options.length === 0) {
        // Still collecting question text
        isCollectingQuestion = true
        
        // If line starts with number (1., 2., etc), it's likely content
        if (numberedItemPattern.test(trimmed)) {
          if (trimmed) {
            questionTextBuffer.push(trimmed)
          }
        } else {
          // Check if this might be the start of options (looks like option but not matched)
          // If it does, don't add to question
          if (!looksLikeOption.test(trimmed)) {
            questionTextBuffer.push(trimmed)
          }
        }
      } else {
        // We have options, so this text belongs to last option
        isCollectingQuestion = false
        const last = current.options[current.options.length - 1]
        const updatedValue = `${last.value} ${trimmed}`.trim()
        last.value = stripMarker(updatedValue)
        // Update correctness based on new text (red, colored, or asterisk)
        if (markCorrect(updatedValue, isColored, isRed)) {
          last.isCorrect = true
        }
        // Image already handled above
      }
    }
  })

  // Flush last question
  if (current) {
    const finalQuestion: ParsedQuestion = current
    // Apply buffered question text before adding options
    if (questionTextBuffer.length > 0 && finalQuestion.options.length === 0) {
      const bufferedText = questionTextBuffer.join(' ').trim()
      if (bufferedText) {
        if (finalQuestion.content) {
          finalQuestion.content = `${finalQuestion.content}\n${bufferedText}`.trim()
        } else if (finalQuestion.title.length < 200) {
          finalQuestion.title = `${finalQuestion.title} ${bufferedText}`.trim()
        } else {
          finalQuestion.content = bufferedText
        }
      }
    }
    items.push(finalQuestion)
  }

  items.forEach((question) => {
    // Detect matching questions (pairs separated by |)
    const matchingPattern = /([^|]+)\|([^|]+)/g
    const fullText = `${question.title} ${question.content}`.trim()
    const matches = Array.from(fullText.matchAll(matchingPattern))
    
    if (matches.length >= 2 && question.options.length === 0) {
      // This is a matching question
      question.type = 'matching'
      
      // Extract pairs from title/content
      matches.forEach((match, index) => {
        const left = match[1].trim()
        const right = match[2].trim()
        
        // Add left item (even index)
        question.options.push({
          key: `L${index + 1}`,
          value: left,
          isCorrect: true,  // All pairs are correct in matching
          imageUrl: undefined
        })
        
        // Add right item (odd index)
        question.options.push({
          key: `R${index + 1}`,
          value: right,
          isCorrect: true,
          imageUrl: undefined
        })
        
        question.correct.add(index * 2)
        question.correct.add(index * 2 + 1)
      })
      
      // Clean up title (remove the pairs, keep only the question part)
      const cleanTitle = question.title.split(/[:|](?=\s*[A-Z])/)[0].trim()
      question.title = cleanTitle
      question.content = ''
      return
    }
    
    // Detect true/false questions - more comprehensive
    // Check if question has exactly 2 options that are True/False
    if (question.options.length === 2) {
      const opt1 = question.options[0].value.trim().toLowerCase()
      const opt2 = question.options[1].value.trim().toLowerCase()
      
      // Check various True/False patterns - be more flexible
      const truePatterns = ['đúng', 'true', 'yes', 'có', 't', 'đúng.', 'true.', 'yes.', 'có.', 't.', 'đ', 'đúng!', 'true!']
      const falsePatterns = ['sai', 'false', 'no', 'không', 'f', 'sai.', 'false.', 'no.', 'không.', 'f.', 's', 'sai!', 'false!']
      
      // Normalize: remove extra whitespace and punctuation
      const normalizeOption = (opt: string) => {
        return opt.replace(/[.!?,\s]+$/g, '').trim().toLowerCase()
      }
      
      const norm1 = normalizeOption(opt1)
      const norm2 = normalizeOption(opt2)
      
      const hasTrue = truePatterns.some(pattern => {
        const normPattern = normalizeOption(pattern)
        return norm1 === normPattern || norm2 === normPattern || 
               norm1.startsWith(normPattern) || norm2.startsWith(normPattern) ||
               norm1.includes('đúng') || norm2.includes('đúng') ||
               norm1.includes('true') || norm2.includes('true')
      })
      
      const hasFalse = falsePatterns.some(pattern => {
        const normPattern = normalizeOption(pattern)
        return norm1 === normPattern || norm2 === normPattern ||
               norm1.startsWith(normPattern) || norm2.startsWith(normPattern) ||
               norm1.includes('sai') || norm2.includes('sai') ||
               norm1.includes('false') || norm2.includes('false')
      })
      
      // If we have both true and false patterns, it's a true/false question
      if ((hasTrue && hasFalse) || 
          (norm1.includes('đúng') && norm2.includes('sai')) ||
          (norm1.includes('sai') && norm2.includes('đúng')) ||
          (norm1.includes('true') && norm2.includes('false')) ||
          (norm1.includes('false') && norm2.includes('true')) ||
          (norm1 === 'đúng' && norm2 === 'sai') ||
          (norm1 === 'sai' && norm2 === 'đúng') ||
          (norm1 === 'true' && norm2 === 'false') ||
          (norm1 === 'false' && norm2 === 'true')) {
        question.type = 'truefalse'
        // Ensure correct ordering: Đúng/True first, Sai/False second
        // Check which option is false
        const isFirstFalse = falsePatterns.some(p => {
          const normP = normalizeOption(p)
          return norm1 === normP || norm1.startsWith(normP) || norm1.includes('sai') || norm1.includes('false')
        }) || norm1 === 'false' || norm1 === 'sai' || norm1.includes('sai') || norm1.includes('false')
        
        if (isFirstFalse) {
          // Swap options to put Đúng/True first
          const temp = question.options[0]
          question.options[0] = question.options[1]
          question.options[1] = temp
        }
      }
    }
    
    // Process numbered items in content (1) Text 2) Text) or (1. Text 2. Text)
    if (question.content && question.options.length === 0) {
      // Try pattern with parenthesis: 1) Text 2) Text
      let numberedPattern = /(\d+)\)\s*([^0-9]+?)(?=\d+\)|$)/g
      let numberedMatches = Array.from(question.content.matchAll(numberedPattern))
      
      // If no matches, try pattern with dots: 1. Text 2. Text
      if (numberedMatches.length < 2) {
        numberedPattern = /(\d+)\.\s+([^0-9]+?)(?=\d+\.|$)/g
        numberedMatches = Array.from(question.content.matchAll(numberedPattern))
      }
      
      // If still no matches, try pattern with dashes: 1- Text 2- Text
      if (numberedMatches.length < 2) {
        numberedPattern = /(\d+)-\s+([^0-9]+?)(?=\d+-|$)/g
        numberedMatches = Array.from(question.content.matchAll(numberedPattern))
      }
      
      if (numberedMatches.length >= 2) {
        // This is likely a question with numbered options
        numberedMatches.forEach((match, index) => {
          const text = match[2].trim()
          const isCorrect = /đúng|true|correct/i.test(text) || 
                           text.toLowerCase().includes('*')
          
          question.options.push({
            key: String.fromCharCode(65 + index),  // A, B, C, D
            value: text.replace(/\*+/g, '').trim(),
            isCorrect: isCorrect,
            imageUrl: undefined
          })
        })
        
        // Clean content if we extracted options
        if (question.options.length > 0) {
          question.content = ''
        }
      } else {
        // Try to split by common separators if content is long and has multiple sentences
        const sentences = question.content.split(/[.!?]\s+/).filter(s => s.trim().length > 10)
        if (sentences.length >= 2 && sentences.length <= 6) {
          // Might be options separated by sentences
          sentences.forEach((sentence, index) => {
            const text = sentence.trim()
            const isCorrect = /đúng|true|correct/i.test(text) || 
                             text.toLowerCase().includes('*')
            
            question.options.push({
              key: String.fromCharCode(65 + index),
              value: text.replace(/\*+/g, '').trim(),
              isCorrect: isCorrect,
              imageUrl: undefined
            })
          })
          
          if (question.options.length >= 2) {
            question.content = ''
          } else {
            // Reset if we didn't get enough options
            question.options = []
          }
        }
      }
    }

    // Detect matching questions using arrow notation (e.g., A → B)
    if (question.options.length === 0) {
      // Combine title and content to search for matching pairs
      const fullText = `${question.title} ${question.content || ''}`.trim()
      // Find arrow patterns: match text before → and text after until next arrow or end
      // More precise: stop right side at word boundary before next potential left item
      const arrowPattern = /([^→\n]+?)→\s*([^→\n]+?)(?=\s*(?:[A-Z][A-Za-z]+\s*→|$|\n))/g
      const arrowMatches = Array.from(fullText.matchAll(arrowPattern))

      if (arrowMatches.length >= 2) {
        question.type = 'matching'
        question.options = []
        question.correct.clear()

        arrowMatches.forEach((match, index) => {
          let leftRaw = match[1]
          let rightRaw = match[2]
          
          // For first match, remove title part (everything before last colon or newline)
          if (index === 0) {
            const colonIndex = leftRaw.lastIndexOf(':')
            const newlineIndex = leftRaw.lastIndexOf('\n')
            const separatorIndex = Math.max(colonIndex, newlineIndex)
            if (separatorIndex > 0) {
              leftRaw = leftRaw.substring(separatorIndex + 1)
            }
          }
          
          // Remove bullet points and clean up
          const left = leftRaw
            .replace(/^[\s•●▪·\u2022\u25CF\u25A0\u2023\uF0B7:]+/, '')  // Remove leading bullets, colons
            .replace(/[•●▪·\u2022\u25CF\u25A0\u2023\uF0B7]+$/, '')      // Remove trailing bullets
            .trim()
          
          // Clean up right side (pattern already stops at next pair)
          const right = rightRaw
            .replace(/^[\s•●▪·\u2022\u25CF\u25A0\u2023\uF0B7]+/, '')  // Remove leading bullets
            .replace(/[•●▪·\u2022\u25CF\u25A0\u2023\uF0B7]+$/, '')    // Remove trailing bullets
            .trim()

          question.options.push({
            key: `L${index + 1}`,
            value: left,
            isCorrect: true,
            imageUrl: undefined,
          })

          question.options.push({
            key: `R${index + 1}`,
            value: right,
            isCorrect: true,
            imageUrl: undefined,
          })

          question.correct.add(index * 2)
          question.correct.add(index * 2 + 1)
        })

        // Extract clean title (before first arrow, colon, or the matching pairs start)
        // Find where the first matching pair starts (usually after colon or on new line)
        const firstArrowIndex = fullText.indexOf('→')
        if (firstArrowIndex > 0) {
          // Try to find the question part before the pairs
          const beforeArrow = fullText.substring(0, firstArrowIndex)
          // Look for colon or newline as separator
          const colonIndex = beforeArrow.lastIndexOf(':')
          const newlineIndex = beforeArrow.lastIndexOf('\n')
          const separatorIndex = Math.max(colonIndex, newlineIndex)
          if (separatorIndex > 0) {
            question.title = beforeArrow.substring(0, separatorIndex).trim()
          } else {
            question.title = beforeArrow.trim()
          }
        } else {
          question.title = question.title.split(/[:\-]/)[0].trim()
        }
        question.content = ''
        return
      }
    }

    // Detect inline fill-in-the-blank answers appended after question mark
    if (question.options.length === 0) {
      const fillMatch = question.title.match(/(.+\?)\s*([A-Za-zÀ-ỹ0-9_\(\)\[\]\/\\\-\.\s]{1,80})$/u)
      if (fillMatch) {
        const prompt = fillMatch[1].trim()
        const answer = fillMatch[2].trim()

        if (answer && answer.length < 60) {
          question.title = prompt
          question.type = 'fill_in_blank' as any
          question.options = [{ key: 'A', value: answer, isCorrect: true, imageUrl: undefined }]
          question.correct = new Set([0])
          question.multi = false
        }
      }
    }
    
    question.options.forEach((option, index) => {
      if (option.isCorrect) {
        question.correct.add(index)
      }
    })
    if (question.correct.size > 1 && question.type !== 'matching') {
      question.multi = true
    }
  })

  // Allow questions without options (theory questions)
  // Only filter out questions that have exactly 1 option (incomplete) unless they are fill-in-blank
  return items.filter((item) => item.options.length !== 1 || item.type === 'fill_in_blank')
}

export type ParsedQuizQuestion = ReturnType<typeof groupQuestions>

export type SanitizedQuizQuestion = {
  id: string
  title: string
  content?: string
  imageUrl?: string
  type?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'MATCHING' | 'FILL_IN_BLANK'
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
  questions.map((question) => {
    // Determine question type
    let questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'MATCHING' | 'FILL_IN_BLANK' = 'SINGLE_CHOICE'

    if (question.type === 'matching') {
      questionType = 'MATCHING'
    } else if (question.type === 'fill_in_blank') {
      questionType = 'FILL_IN_BLANK'
    } else if (question.multi || question.correct.size > 1) {
      questionType = 'MULTIPLE_CHOICE'
    }
    
    return {
      id: question.id,
      title: question.title,
      content: question.content || undefined,
      imageUrl: question.imageUrl,
      type: questionType,
      options: question.options.map((option, index) => ({
        id: `${question.id}-option-${index}`,
        text: option.value,
        isCorrect: option.isCorrect,
        order: index,
        imageUrl: option.imageUrl,
      })),
      multi: question.multi,
    }
  })