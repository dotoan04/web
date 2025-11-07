import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import { parseQuizContent, sanitizeParsedQuestions } from '@/lib/quizz/word-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const targetPath = process.argv[2]

if (!targetPath) {
  console.error('Usage: npx tsx scripts/debug-quiz-parse.ts <path-to-docx>')
  process.exit(1)
}

const absolutePath = resolve(__dirname, '..', targetPath)

async function main() {
  const nodeBuffer = readFileSync(absolutePath)
  const arrayBuffer = nodeBuffer.buffer.slice(
    nodeBuffer.byteOffset,
    nodeBuffer.byteOffset + nodeBuffer.byteLength
  )

  const parsed = await parseQuizContent({ buffer: arrayBuffer })
  console.log(JSON.stringify(parsed, null, 2))
  console.log('\nSanitized questions:\n')
  console.log(JSON.stringify(sanitizeParsedQuestions(parsed), null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

