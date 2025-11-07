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
  content: string  // Content/body for theory questions
  imageUrl?: string
  options: Array<{ key: string; value: string; isCorrect: boolean; imageUrl?: string }>
  correct: Set<number>
  multi: boolean
  type?: 'matching' | 'truefalse' | 'regular' | 'fillinblank'
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
  try {
    // Ensure we have valid image data
    if (!imageData || imageData.length === 0) {
      throw new Error('Image data is empty')
    }

    // Convert Uint8Array to Buffer properly
    // Handle both Uint8Array and regular array
    const buffer = Buffer.isBuffer(imageData) 
      ? imageData 
      : Buffer.from(imageData.buffer, imageData.byteOffset, imageData.byteLength)
    
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
        
        const base64Url = convertImageToBase64(imageData, detectedExtension)
        imageCache.set(relId, base64Url)
      } catch (error) {
        console.error(`Failed to load image ${imagePath}:`, error)
        // Continue processing other images instead of failing completely
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
  let questionTextBuffer: string[] = [] // Buffer to collect question text before options start
  let isCollectingQuestion = false

  const questionPattern = /^(Câu\s+\d+\s*[:\.\-]?)(.*)$/i
  // More strict option pattern - must be at start of line and followed by space/dot
  const optionPattern = /^([A-DĐ])[\.\)]\s+(.+)$/i
  const labelPattern = /^(Chọn\s*\d+\s*(?:đáp\s*án|phương\s*án)\s*đúng)/i
  const multiPattern = /(Chọn\s*\d+\s*đáp\s*án\s*đúng|Chọn\s*\d+\s*phương\s*án)/i
  const trueFalsePattern = /^(Đúng|Sai|True|False)$/i
  const numberedItemPattern = /^\d+[\.\)]\s+/  // Match "1. " or "1) "
  // Pattern to detect if a line is likely an answer option (starts with A-D followed by dot/parenthesis)
  const looksLikeOption = /^[A-DĐ][\.\)]\s/
  const fillInBlankPattern = /Câu\s+\d+.*?(\p{So}+)/u

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

    // Check if this looks like an option - must be more strict
    const optionMatch = trimmed.match(optionPattern)
    if (optionMatch && current) {
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

      const [, key, rest] = optionMatch
      const original = rest.trim()
      const isCorrect = markCorrect(original, isColored)
      const value = stripMarker(original)
      current.options.push({ key: key.trim(), value, isCorrect, imageUrl: imageId || undefined })
      return
    }

    // Support for True/False questions - more flexible matching
    const trueFalseMatch = trimmed.match(trueFalsePattern)
    if (trueFalseMatch && current) {
      // Only add if we don't have 2 options yet, or if we're explicitly looking for T/F
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

        const key = current.options.length === 0 ? 'A' : 'B'
        const isCorrect = markCorrect(trimmed, isColored)
        current.options.push({ key, value: trimmed, isCorrect, imageUrl: imageId || undefined })
        return
      }
    }

    // Handle numbered list items (1. 2. etc) as options if we're past question text
    if (current && numId && !isCollectingQuestion) {
      const existingKeys = current.options.length
      if (existingKeys < 10) { // Limit to reasonable number of options
        const key = String.fromCharCode(65 + existingKeys)
        const isCorrect = markCorrect(trimmed, isColored)
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
            const isCorrect = markCorrect(original, isColored)
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
        if (markCorrect(updatedValue, isColored)) {
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
    // Detect fill-in-the-blank questions (red text that should be hidden)
    const fillInBlankMatch = question.title.match(fillInBlankPattern)
    if (fillInBlankMatch && question.options.length === 0) {
      // This is a fill-in-the-blank question
      question.type = 'fillinblank'
      
      // Extract the red text (correct answer) and create a placeholder
      const correctAnswer = fillInBlankMatch[1].trim()
      
      // Replace the red text with a placeholder in the title
      const questionTitle = question.title.replace(fillInBlankPattern, '_______')
      question.title = questionTitle
      
      // Store the correct answer in a special option for fill-in-the-blank
      question.options.push({
        key: 'ANSWER',
        value: correctAnswer,
        isCorrect: true,
        imageUrl: undefined
      })
      
      question.correct.add(0)
      return
    }
    
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
    if (question.options.length === 2) {
      const opt1 = question.options[0].value.trim().toLowerCase()
      const opt2 = question.options[1].value.trim().toLowerCase()
      
      // Check various True/False patterns
      const truePatterns = ['đúng', 'true', 'yes', 'có', 't', 'đúng.', 'true.', 'yes.', 'có.', 't.']
      const falsePatterns = ['sai', 'false', 'no', 'không', 'f', 'sai.', 'false.', 'no.', 'không.', 'f.']
      
      const hasTrue = truePatterns.some(pattern => opt1 === pattern || opt2 === pattern)
      const hasFalse = falsePatterns.some(pattern => opt1 === pattern || opt2 === pattern)
      
      // Also check if options are exactly "Đúng" and "Sai" (case-insensitive)
      if ((hasTrue && hasFalse) || 
          (opt1 === 'đúng' && opt2 === 'sai') ||
          (opt1 === 'sai' && opt2 === 'đúng') ||
          (opt1 === 'true' && opt2 === 'false') ||
          (opt1 === 'false' && opt2 === 'true')) {
        question.type = 'truefalse'
        // Ensure correct ordering: Đúng/True first, Sai/False second
        if (falsePatterns.some(p => opt1 === p) || opt1 === 'false' || opt1 === 'sai') {
          // Swap options
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
  // Only filter out questions that have exactly 1 option (incomplete)
  return items.filter((item) => item.options.length !== 1)
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
    } else if (question.type === 'fillinblank') {
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