'use client'

import matter from 'gray-matter'
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { lowlight } from '@/lib/lowlight'
import { createCodeBlockExtension } from '@/components/editor/extensions/code-block'

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
  // Import remark dynamically
  const { unified } = await import('unified')
  const remarkParse = (await import('remark-parse')).default
  const remarkGfm = (await import('remark-gfm')).default
  
  // Parse markdown to MDAST (Markdown Abstract Syntax Tree)
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
  
  const mdast = processor.parse(markdown)
  
  // Convert MDAST to HTML first (easier path)
  const html = mdastToHTML(mdast)
  
  // Use TipTap's generateHTML to convert HTML to JSON
  try {
    const extensions = [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false,
      }),
      createCodeBlockExtension(lowlight),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-ink-700 underline decoration-ink-300 underline-offset-4 hover:text-ink-900',
        },
      }),
      Image.configure({ 
        inline: false, 
        HTMLAttributes: { class: 'rounded-2xl shadow-lg my-8' } 
      }),
    ]
    
    const json = generateHTML({ type: 'doc', content: parseHTMLToTipTap(html) }, extensions)
    
    // Parse back to JSON structure
    const parser = new DOMParser()
    const doc = parser.parseFromString(json, 'text/html')
    
    return htmlToTipTapJSON(doc.body)
  } catch (error) {
    console.error('Error converting markdown to TipTap JSON:', error)
    // Fallback: return simple paragraph
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
 * Convert MDAST to HTML
 */
function mdastToHTML(node: any): string {
  if (!node) return ''
  
  switch (node.type) {
    case 'root':
      return node.children?.map(mdastToHTML).join('') || ''
    
    case 'paragraph':
      const pContent = node.children?.map(mdastToHTML).join('') || ''
      return `<p>${pContent}</p>`
    
    case 'heading':
      const hContent = node.children?.map(mdastToHTML).join('') || ''
      return `<h${node.depth}>${hContent}</h${node.depth}>`
    
    case 'text':
      return escapeHtml(node.value || '')
    
    case 'emphasis':
      return `<em>${node.children?.map(mdastToHTML).join('') || ''}</em>`
    
    case 'strong':
      return `<strong>${node.children?.map(mdastToHTML).join('') || ''}</strong>`
    
    case 'link':
      const linkText = node.children?.map(mdastToHTML).join('') || ''
      return `<a href="${escapeHtml(node.url || '')}">${linkText}</a>`
    
    case 'image':
      return `<img src="${escapeHtml(node.url || '')}" alt="${escapeHtml(node.alt || '')}" />`
    
    case 'code':
      return `<code>${escapeHtml(node.value || '')}</code>`
    
    case 'inlineCode':
      return `<code>${escapeHtml(node.value || '')}</code>`
    
    case 'blockquote':
      const bqContent = node.children?.map(mdastToHTML).join('') || ''
      return `<blockquote>${bqContent}</blockquote>`
    
    case 'list':
      const listItems = node.children?.map(mdastToHTML).join('') || ''
      return node.ordered ? `<ol>${listItems}</ol>` : `<ul>${listItems}</ul>`
    
    case 'listItem':
      const liContent = node.children?.map(mdastToHTML).join('') || ''
      return `<li>${liContent}</li>`
    
    case 'break':
      return '<br />'
    
    case 'thematicBreak':
      return '<hr />'
    
    default:
      return node.children?.map(mdastToHTML).join('') || ''
  }
}

/**
 * Parse HTML to TipTap nodes
 */
function parseHTMLToTipTap(html: string): any[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return Array.from(doc.body.childNodes).map(nodeToTipTap).filter(Boolean)
}

/**
 * Convert HTML node to TipTap JSON
 */
function htmlToTipTapJSON(element: HTMLElement): Record<string, unknown> {
  const content: any[] = []
  
  Array.from(element.childNodes).forEach((node) => {
    const tipTapNode = nodeToTipTap(node)
    if (tipTapNode) content.push(tipTapNode)
  })
  
  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  }
}

/**
 * Convert single HTML node to TipTap node
 */
function nodeToTipTap(node: Node): any {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || ''
    return text.trim() ? { type: 'text', text } : null
  }
  
  if (node.nodeType !== Node.ELEMENT_NODE) return null
  
  const element = node as HTMLElement
  const tagName = element.tagName.toLowerCase()
  
  switch (tagName) {
    case 'p':
      return {
        type: 'paragraph',
        content: getChildNodes(element),
      }
    
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      const level = parseInt(tagName[1])
      return {
        type: 'heading',
        attrs: { level: level >= 2 ? level : 2 },
        content: getChildNodes(element),
      }
    
    case 'strong':
    case 'b':
      return getChildNodes(element).map((child: any) => ({
        ...child,
        marks: [...(child.marks || []), { type: 'bold' }],
      }))
    
    case 'em':
    case 'i':
      return getChildNodes(element).map((child: any) => ({
        ...child,
        marks: [...(child.marks || []), { type: 'italic' }],
      }))
    
    case 'a':
      const href = element.getAttribute('href') || ''
      return getChildNodes(element).map((child: any) => ({
        ...child,
        marks: [...(child.marks || []), { type: 'link', attrs: { href } }],
      }))
    
    case 'code':
      return {
        type: 'text',
        text: element.textContent || '',
        marks: [{ type: 'code' }],
      }
    
    case 'pre':
      const codeElement = element.querySelector('code')
      const codeText = codeElement?.textContent || element.textContent || ''
      const language = codeElement?.className.match(/language-(\w+)/)?.[1] || 'plaintext'
      return {
        type: 'codeBlock',
        attrs: { language },
        content: [{ type: 'text', text: codeText }],
      }
    
    case 'img':
      return {
        type: 'image',
        attrs: {
          src: element.getAttribute('src') || '',
          alt: element.getAttribute('alt') || '',
        },
      }
    
    case 'ul':
      return {
        type: 'bulletList',
        content: Array.from(element.children)
          .filter((child) => child.tagName.toLowerCase() === 'li')
          .map((li) => ({
            type: 'listItem',
            content: getChildNodes(li as HTMLElement),
          })),
      }
    
    case 'ol':
      return {
        type: 'orderedList',
        content: Array.from(element.children)
          .filter((child) => child.tagName.toLowerCase() === 'li')
          .map((li) => ({
            type: 'listItem',
            content: getChildNodes(li as HTMLElement),
          })),
      }
    
    case 'blockquote':
      return {
        type: 'blockquote',
        content: getChildNodes(element),
      }
    
    case 'br':
      return { type: 'hardBreak' }
    
    case 'hr':
      return { type: 'horizontalRule' }
    
    default:
      return {
        type: 'paragraph',
        content: getChildNodes(element),
      }
  }
}

/**
 * Get child nodes as TipTap nodes
 */
function getChildNodes(element: HTMLElement): any[] {
  const nodes: any[] = []
  
  Array.from(element.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || ''
      if (text.trim()) {
        nodes.push({ type: 'text', text })
      }
    } else {
      const tipTapNode = nodeToTipTap(child)
      if (tipTapNode) {
        if (Array.isArray(tipTapNode)) {
          nodes.push(...tipTapNode)
        } else {
          nodes.push(tipTapNode)
        }
      }
    }
  })
  
  return nodes.length > 0 ? nodes : [{ type: 'text', text: '' }]
}

/**
 * Escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

