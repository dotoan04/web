import { readFileSync } from 'node:fs'
import { parseQuizContent, sanitizeParsedQuestions } from '@/lib/quizz/word-parser'

async function main() {
  const text = readFileSync('de-mau-ghep-cap-va-dien-tu.docx.txt', 'utf8')
  const parsed = await parseQuizContent({ text })
  const sanitized = sanitizeParsedQuestions(parsed)
  
  console.log('=== PARSED QUESTIONS ===')
  console.log('Total:', sanitized.length)
  console.log('\n')
  
  sanitized.forEach((q, i) => {
    console.log(`${i + 1}. ${q.title.substring(0, 80)}${q.title.length > 80 ? '...' : ''}`)
    console.log(`   Type: ${q.type}`)
    console.log(`   Options: ${q.options.length}`)
    
    if (q.type === 'MATCHING') {
      console.log(`   Matching pairs: ${q.options.length / 2}`)
      // Show first pair as example
      if (q.options.length >= 2) {
        console.log(`   Example pair: "${q.options[0].text}" ↔ "${q.options[1].text}"`)
      }
    } else if (q.type === 'FILL_IN_BLANK') {
      console.log(`   Correct answer: "${q.options[0]?.text || 'N/A'}"`)
    }
    console.log('')
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

