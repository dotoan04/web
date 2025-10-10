import 'dotenv/config'

import bcrypt from 'bcryptjs'
import { execSync } from 'node:child_process'
import { copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const log = (message: string) => {
  process.stdout.write(`\n⚙️  ${message}\n`)
}

async function ensureEnvFile() {
  const envExample = path.join(projectRoot, '.env.example')
  const envLocal = path.join(projectRoot, '.env.local')

  if (!existsSync(envLocal) && existsSync(envExample)) {
    copyFileSync(envExample, envLocal)
    log('Created .env.local from .env.example')
  }
}

async function ensurePrismaArtifacts() {
  log('Generating Prisma Client')
  execSync('npx prisma generate', { cwd: projectRoot, stdio: 'inherit' })
}

async function runMigrations() {
  log('Applying database migrations')
  execSync('npx prisma migrate deploy', { cwd: projectRoot, stdio: 'inherit' })
}

async function seedDatabase() {
  const { prisma } = await import('../src/lib/prisma')

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set before running setup')
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Quản trị viên',
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Quản trị viên',
    },
  })

  await prisma.category.createMany({
    data: [
      {
        name: 'Nhật ký sống',
        slug: 'nhat-ky-song',
        description: 'Chia sẻ những lát cắt đời sống, hành trình cá nhân.',
      },
      {
        name: 'Lập trình & nghề nghiệp',
        slug: 'lap-trinh-nghe-nghiep',
        description: 'Ghi chép kiến thức, trải nghiệm và mẹo nghề lập trình.',
      },
    ],
    skipDuplicates: true,
  })

  await prisma.tag.createMany({
    data: [
      { name: 'Life', slug: 'life' },
      { name: 'Code', slug: 'code' },
      { name: 'Productivity', slug: 'productivity' },
    ],
    skipDuplicates: true,
  })

  await prisma.siteSetting.createMany({
    data: [
      {
        key: 'site.name',
        value: process.env.SITE_NAME ?? 'BlogVibe Coding',
      },
      {
        key: 'site.slogan',
        value:
          process.env.SITE_SLOGAN ??
          'Không gian viết giản dị về cuộc sống và lập trình.',
      },
      {
        key: 'site.hero',
        value: {
          intro:
            'Kể chuyện đời sống, ghi chú học hỏi và tinh chỉnh tư duy code từng ngày.',
          ctaLabel: 'Khám phá portfolio',
          ctaLink: '/portfolio',
        },
      },
      {
        key: 'portfolio.owner',
        value: {
          name: process.env.PORTFOLIO_OWNER_NAME ?? 'Tên của bạn',
          age: process.env.PORTFOLIO_OWNER_AGE ? Number(process.env.PORTFOLIO_OWNER_AGE) : null,
          avatarUrl: process.env.PORTFOLIO_OWNER_AVATAR_URL ?? null,
        },
      },
    ],
    skipDuplicates: true,
  })

  log('Seeded base content and administrator account')
}

async function main() {
  log('Starting BlogVibe setup')
  await ensureEnvFile()
  await ensurePrismaArtifacts()
  await runMigrations()
  await seedDatabase()
  log('Setup completed successfully')
}

main().catch((error) => {
  console.error('\n❌ Setup failed:', error)
  process.exit(1)
})
