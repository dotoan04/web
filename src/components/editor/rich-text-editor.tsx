'use client'

import type { ElementType } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import { Bold, Code, Heading2, Image as ImageIcon, Italic, Link2, List, ListOrdered } from 'lucide-react'
import { lowlight } from '@/lib/lowlight'

import { Button } from '@/components/ui/button'
import { cn } from '@/components/ui/cn'
import { createCodeBlockExtension } from '@/components/editor/extensions/code-block'
import { CODE_LANGUAGES } from '@/lib/code-languages'

export type RichTextEditorProps = {
  value?: Record<string, unknown>
  onChange?: (content: Record<string, unknown>) => void
  placeholder?: string
  uploaderId?: string
}

const MenuButton = ({
  onClick,
  isActive,
  icon: Icon,
  label,
}: {
  onClick: () => void
  isActive?: boolean
  icon: ElementType
  label: string
}) => (
  <button
    type="button"
    className={cn(
      'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-ink-500 transition hover:bg-ink-100',
      isActive ? 'bg-ink-800 text-ink-50 shadow' : 'bg-white'
    )}
    onClick={onClick}
    title={label}
  >
    <Icon size={18} />
  </button>
)

export const RichTextEditor = ({ value, onChange, placeholder, uploaderId }: RichTextEditorProps) => {
  const cached = useRef(value)
  const [uploading, setUploading] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
        codeBlock: false,
        link: false,
      }),
      createCodeBlockExtension(lowlight),
      Placeholder.configure({
        placeholder: placeholder ?? 'Bắt đầu gõ nội dung câu chuyện tại đây...',
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-ink-700 underline decoration-ink-300 underline-offset-4 hover:text-ink-900',
        },
      }),
      Image.configure({ inline: false, HTMLAttributes: { class: 'rounded-2xl shadow-lg my-8' } }),
    ],
    content: value ?? {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Xin chào! Hãy viết vài dòng tâm sự tại đây.',
            },
          ],
        },
      ],
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-ink max-w-none rounded-3xl border border-ink-100 bg-white/90 p-6 text-base leading-7 text-ink-800 focus:outline-none',
      },
    },
    onUpdate({ editor }) {
      const json = editor.getJSON()
      cached.current = json
      onChange?.(json)
    },
  })

  useEffect(() => {
    if (!editor) return
    if (!value) return
    if (JSON.stringify(value) === JSON.stringify(cached.current)) return
    editor.commands.setContent(value)
  }, [editor, value])

  const setLink = useCallback(
    (currentEditor: Editor) => {
      const previousUrl = currentEditor.getAttributes('link').href
      const url = window.prompt('Nhập liên kết', previousUrl)

      if (url === null) return
      if (url === '') {
        currentEditor.chain().focus().unsetLink().run()
        return
      }
      currentEditor.chain().focus().setLink({ href: url }).run()
    },
    []
  )

  const uploadImage = useCallback(
    async (files: FileList | null, currentEditor: Editor) => {
      if (!files?.length) return
      const file = files[0]
      const formData = new FormData()
      formData.append('file', file)
      if (uploaderId) {
        formData.append('uploaderId', uploaderId)
      }

      setUploading(true)
      try {
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error ?? 'Upload thất bại')
        }
        currentEditor.chain().focus().setImage({ src: data.url, alt: file.name }).run()
      } catch (error) {
        console.error('Upload image failed', error)
        alert('Tải ảnh lên không thành công, vui lòng thử lại.')
      } finally {
        setUploading(false)
      }
    },
    [uploaderId]
  )

  const hiddenFileInput = useRef<HTMLInputElement | null>(null)

  const menu = useMemo(() => {
    if (!editor) return null
    return (
      <div className="flex flex-wrap gap-2 rounded-2xl border border-ink-100 bg-white/90 p-3 shadow-lg">
        <MenuButton
          icon={Bold}
          label="In đậm"
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <MenuButton
          icon={Italic}
          label="In nghiêng"
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <MenuButton
          icon={Heading2}
          label="Heading"
          isActive={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <MenuButton
          icon={List}
          label="Danh sách chấm"
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <MenuButton
          icon={ListOrdered}
          label="Danh sách số"
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <MenuButton
          icon={Code}
          label="Đoạn mã"
          isActive={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />
        <MenuButton icon={Link2} label="Chèn liên kết" onClick={() => setLink(editor)} />
        <MenuButton
          icon={ImageIcon}
          label={uploading ? 'Đang tải...' : 'Chèn ảnh'}
          onClick={() => hiddenFileInput.current?.click()}
        />
      </div>
    )
  }, [editor, setLink, uploading])

  const codeLanguage = editor?.getAttributes('codeBlock')?.language ?? 'plaintext'
  const highlightLines = editor?.getAttributes('codeBlock')?.highlight ?? ''

  if (!editor) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-ink-100 bg-white/90 p-6 text-ink-400">
        Đang khởi tạo trình soạn thảo…
      </div>
    )
  }

  return (
    <div className="relative flex flex-col gap-4">
      <input
        ref={hiddenFileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => uploadImage(event.target.files, editor)}
      />

      {menu}

      {editor.isActive('codeBlock') ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink-100 bg-white/80 px-4 py-3 text-sm shadow-sm dark:border-ink-700 dark:bg-ink-800/70">
          <label className="flex items-center gap-2">
            <span className="text-ink-500 dark:text-ink-300">Ngôn ngữ</span>
            <select
              value={codeLanguage}
              onChange={(event) =>
                editor.chain().focus().updateAttributes('codeBlock', { language: event.target.value }).run()
              }
              className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-sm text-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-300 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
            >
              {CODE_LANGUAGES.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-ink-500 dark:text-ink-300">Highlight</span>
            <input
              value={highlightLines}
              onChange={(event) =>
                editor.chain().focus().updateAttributes('codeBlock', { highlight: event.target.value }).run()
              }
              placeholder="vd: 1,3-4"
              className="w-28 rounded-lg border border-ink-200 bg-white px-2 py-1 text-sm text-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-300 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
            />
          </label>
        </div>
      ) : null}

      <EditorContent editor={editor} />

      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            editor.commands.setContent({ type: 'doc', content: [] })
            onChange?.({ type: 'doc', content: [] })
          }}
        >
          Xoá nội dung
        </Button>
      </div>
    </div>
  )
}
