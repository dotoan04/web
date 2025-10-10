import { spawn } from 'node:child_process'
import { rmSync } from 'node:fs'
import path from 'node:path'

const projectRoot = path.resolve(__dirname, '..')

const runBuild = () =>
  new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/build.js'], {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env, ANALYZE: 'true' },
    })

    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`build exited with code ${code}`))
    })
  })

async function main() {
  rmSync(path.join(projectRoot, '.next', 'analyze'), { recursive: true, force: true })
  await runBuild()
}

main().catch((error) => {
  console.error('Bundle analysis failed:', error)
  process.exit(1)
})
