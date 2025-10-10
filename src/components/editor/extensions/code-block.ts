import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import type { LowlightInstance } from '@/lib/lowlight'

export const createCodeBlockExtension = (lowlight: LowlightInstance) =>
  CodeBlockLowlight.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        language: {
          default: 'plaintext',
          parseHTML: (element) => element.getAttribute('data-language') || 'plaintext',
          renderHTML: ({ language }) => ({ 'data-language': language }),
        },
        highlight: {
          default: '',
          parseHTML: (element) => element.getAttribute('data-highlight') || '',
          renderHTML: ({ highlight }) => (highlight ? { 'data-highlight': highlight } : {}),
        },
      }
    },
  }).configure({ lowlight })
