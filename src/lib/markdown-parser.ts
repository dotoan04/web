'use client'

import matter from 'gray-matter'

export type MarkdownMetadata = {
  title?: string
  slug?: string
  excerpt?: string
  categoryId?: string | null
  tagIds?: string[]
  status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED'
  publishedAt?: string
  coverImageId?: string | null
  [key: string]: unknown
}

export type ParsedMarkdown = {
  metadata: MarkdownMetadata
  content: string
}

/**
 * Parse markdown file content với frontmatter
 */
export function parseMarkdownFile(fileContent: string): ParsedMarkdown {
  const { data, content } = matter(fileContent)
  
  return {
    metadata: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || data.description,
      categoryId: data.categoryId || data.category || null,
      tagIds: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
      status: data.status || 'DRAFT',
      publishedAt: data.publishedAt || data.date,
      coverImageId: data.coverImageId || data.cover || null,
      ...data,
    },
    content,
  }
}

/**
 * Chuyển đổi markdown content sang TipTap JSON format
 */
export async function markdownToTipTapJSON(markdown: string): Promise<Record<string, unknown>> {
  try {
    const lines = markdown.split('\n')
    const content: any[] = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i]

      // Empty line - skip
      if (!line.trim()) {
        i++
        continue
      }

      // Heading
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
      if (headingMatch) {
        const level = Math.min(Math.max(headingMatch[1].length, 2), 4)
        content.push({
          type: 'heading',
          attrs: { level },
          content: parseInlineContent(headingMatch[2]),
        })
        i++
        continue
      }

      // Code block
      if (line.startsWith('```')) {
        const language = line.slice(3).trim() || 'plaintext'
        const codeLines: string[] = []
        i++
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i])
          i++
        }
        content.push({
          type: 'codeBlock',
          attrs: { language },
          content: [{ type: 'text', text: codeLines.join('\n') }],
        })
        i++ // skip closing ```
        continue
      }

      // Unordered list
      if (line.match(/^[-*+]\s+/)) {
        const listItems: any[] = []
        while (i < lines.length && lines[i].match(/^[-*+]\s+/)) {
          const itemText = lines[i].replace(/^[-*+]\s+/, '')
          listItems.push({
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: parseInlineContent(itemText),
              },
            ],
          })
          i++
        }
        content.push({
          type: 'bulletList',
          content: listItems,
        })
        continue
      }

      // Ordered list
      if (line.match(/^\d+\.\s+/)) {
        const listItems: any[] = []
        while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
          const itemText = lines[i].replace(/^\d+\.\s+/, '')
          listItems.push({
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: parseInlineContent(itemText),
              },
            ],
          })
          i++
        }
        content.push({
          type: 'orderedList',
          content: listItems,
        })
        continue
      }

      // Blockquote
      if (line.startsWith('> ')) {
        const quoteLines: string[] = []
        while (i < lines.length && lines[i].startsWith('> ')) {
          quoteLines.push(lines[i].replace(/^>\s*/, ''))
          i++
        }
        content.push({
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: parseInlineContent(quoteLines.join(' ')),
            },
          ],
        })
        continue
      }

      // Regular paragraph
      const paragraphLines: string[] = [line]
      i++
      while (i < lines.length && lines[i].trim() && !isSpecialLine(lines[i])) {
        paragraphLines.push(lines[i])
        i++
      }
      content.push({
        type: 'paragraph',
        content: parseInlineContent(paragraphLines.join(' ')),
      })
    }

    return {
      type: 'doc',
      content: content.length > 0 ? content : [{ type: 'paragraph', content: [] }],
    }
  } catch (error) {
    console.error('Error converting markdown to TipTap JSON:', error)
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: markdown }],
        },
      ],
    }
  }
}

/**
 * Check if line is special (heading, code, list, etc)
 */
function isSpecialLine(line: string): boolean {
  return (
    line.match(/^#{1,6}\s+/) !== null ||
    line.startsWith('```') ||
    line.match(/^[-*+]\s+/) !== null ||
    line.match(/^\d+\.\s+/) !== null ||
    line.startsWith('> ')
  )
}

/**
 * Parse inline content (bold, italic, links, images, code)
 * Process in order: code, bold, italic, links to avoid conflicts
 */
function parseInlineContent(text: string): any[] {
  if (!text.trim()) {
    return []
  }

  // First pass: extract code segments to protect them
  const codeSegments: Array<{ placeholder: string; text: string }> = []
  let protectedText = text.replace(/`([^`]+)`/g, (match, code) => {
    const placeholder = `__CODE_${codeSegments.length}__`
    codeSegments.push({ placeholder, text: code })
    return placeholder
  })

  // Second pass: parse remaining formatting
  const nodes: any[] = []
  let remaining = protectedText

  // Pattern: **bold**, *italic*, [link](url)
  const pattern = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)]+)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(protectedText)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      const beforeText = protectedText.slice(lastIndex, match.index)
      nodes.push(...restoreCodeSegments(beforeText, codeSegments))
    }

    // **bold**
    if (match[1]) {
      nodes.push(...restoreCodeSegments(match[2], codeSegments, [{ type: 'bold' }]))
    }
    // *italic*
    else if (match[3]) {
      nodes.push(...restoreCodeSegments(match[4], codeSegments, [{ type: 'italic' }]))
    }
    // [link](url)
    else if (match[5]) {
      nodes.push(...restoreCodeSegments(match[6], codeSegments, [{ type: 'link', attrs: { href: match[7] } }]))
    }

    lastIndex = pattern.lastIndex
  }

  // Add remaining text
  if (lastIndex < protectedText.length) {
    const remainingText = protectedText.slice(lastIndex)
    nodes.push(...restoreCodeSegments(remainingText, codeSegments))
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', text: text }]
}

/**
 * Restore code segments and create text nodes
 */
function restoreCodeSegments(text: string, codeSegments: Array<{ placeholder: string; text: string }>, marks: any[] = []): any[] {
  if (!text) return []

  const nodes: any[] = []
  let remaining = text
  
  codeSegments.forEach(({ placeholder, text: codeText }) => {
    const index = remaining.indexOf(placeholder)
    if (index !== -1) {
      // Add text before placeholder
      if (index > 0) {
        const beforeText = remaining.slice(0, index)
        if (beforeText) {
          nodes.push({
            type: 'text',
            text: beforeText,
            ...(marks.length > 0 && { marks }),
          })
        }
      }
      
      // Add code node
      nodes.push({
        type: 'text',
        text: codeText,
        marks: [...marks, { type: 'code' }],
      })
      
      remaining = remaining.slice(index + placeholder.length)
    }
  })

  // Add remaining text
  if (remaining) {
    nodes.push({
      type: 'text',
      text: remaining,
      ...(marks.length > 0 && { marks }),
    })
  }

  return nodes.length > 0 ? nodes : text ? [{ type: 'text', text, ...(marks.length > 0 && { marks }) }] : []
}
