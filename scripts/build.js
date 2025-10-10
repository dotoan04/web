const fs = require('node:fs')
const path = require('node:path')

const projectRoot = process.cwd()
const sandboxHome = path.join(projectRoot, '.tmp-home')

if (!fs.existsSync(sandboxHome)) {
  fs.mkdirSync(sandboxHome, { recursive: true })
}

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

const appData = path.join(sandboxHome, 'AppData')
const roamingData = path.join(appData, 'Roaming')
const localData = path.join(appData, 'Local')

ensureDir(roamingData)
ensureDir(localData)

process.env.HOME = sandboxHome
process.env.USERPROFILE = sandboxHome
process.env.APPDATA = roamingData
process.env.LOCALAPPDATA = localData

require('./ignore-appdata')

if (!process.argv.slice(2).includes('build')) {
  process.argv.push('build')
}

require('next/dist/bin/next')
