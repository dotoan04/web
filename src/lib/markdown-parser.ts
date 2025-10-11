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
 */
function parseInlineContent(text: string): any[] {
  if (!text.trim()) {
    return []
  }

  const nodes: any[] = []
  let currentText = text
  let lastIndex = 0

  // Pattern để match: **bold**, *italic*, `code`, [link](url), ![alt](url)
  const pattern = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(!?\[([^\]]+)\]\(([^)]+)\))/g
  
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index)
      if (beforeText) {
        nodes.push({ type: 'text', text: beforeText })
      }
    }

    // **bold**
    if (match[1]) {
      nodes.push({
        type: 'text',
        text: match[2],
        marks: [{ type: 'bold' }],
      })
    }
    // *italic*
    else if (match[3]) {
      nodes.push({
        type: 'text',
        text: match[4],
        marks: [{ type: 'italic' }],
      })
    }
    // `code`
    else if (match[5]) {
      nodes.push({
        type: 'text',
        text: match[6],
        marks: [{ type: 'code' }],
      })
    }
    // ![image](url) or [link](url)
    else if (match[7]) {
      const isImage = match[7].startsWith('!')
      if (isImage) {
        // Images are not inline in TipTap, skip for now
        nodes.push({ type: 'text', text: match[7] })
      } else {
        nodes.push({
          type: 'text',
          text: match[8],
          marks: [{ type: 'link', attrs: { href: match[9] } }],
        })
      }
    }

    lastIndex = pattern.lastIndex
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex)
    if (remainingText) {
      nodes.push({ type: 'text', text: remainingText })
    }
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', text: text }]
}
