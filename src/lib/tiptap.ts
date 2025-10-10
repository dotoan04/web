type TiptapNode = {
  type?: string
  text?: string
  content?: TiptapNode[]
}

export const extractPlainText = (node: TiptapNode | null | undefined): string => {
  if (!node) return ''
  if (node.text) return node.text
  if (!node.content) return ''
  return node.content.map(extractPlainText).join(' ')
}
