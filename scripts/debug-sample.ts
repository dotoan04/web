import { readFileSync } from 'node:fs'
import { parseQuizContent } from '@/lib/quizz/word-parser'

async function main() {
  const text = readFileSync('de-mau-ghep-cap-va-dien-tu.docx.txt', 'utf8')
  const parsed = await parseQuizContent({ text })
  
  console.log('=== RAW PARSED QUESTIONS ===\n')
  
  parsed.forEach((q, i) => {
    console.log(`Question ${i + 1}:`)
    console.log(`  ID: ${q.id}`)
    console.log(`  Title: ${q.title.substring(0, 100)}${q.title.length > 100 ? '...' : ''}`)
    console.log(`  Content: ${(q.content || '').substring(0, 100)}${(q.content || '').length > 100 ? '...' : ''}`)
    console.log(`  Type: ${q.type || 'undefined'}`)
    console.log(`  Options: ${q.options.length}`)
    if (q.options.length > 0) {
      q.options.slice(0, 2).forEach((opt, idx) => {
        console.log(`    ${idx + 1}. [${opt.key}] ${opt.value.substring(0, 50)}...`)
      })
    }
    console.log('')
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

