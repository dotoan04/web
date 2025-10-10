import { PrismaClient } from '@/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Tạo admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@thetoan.id.vn' },
    update: {},
    create: {
      email: 'admin@thetoan.id.vn',
      password: hashedPassword,
      name: 'Admin',
      role: 'ADMIN',
      bio: 'Administrator của BlogVibe',
    },
  })

  console.log('✅ Admin user created:', admin.email)

  // Tạo category mẫu
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'lap-trinh' },
      update: {},
      create: {
        name: 'Lập trình',
        slug: 'lap-trinh',
        description: 'Bài viết về lập trình và công nghệ',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'thiet-ke' },
      update: {},
      create: {
        name: 'Thiết kế',
        slug: 'thiet-ke',
        description: 'Bài viết về thiết kế UI/UX',
      },
    }),
  ])

  console.log('✅ Categories created:', categories.length)

  // Tạo tags mẫu
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: 'javascript' },
      update: {},
      create: {
        name: 'JavaScript',
        slug: 'javascript',
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'typescript' },
      update: {},
      create: {
        name: 'TypeScript',
        slug: 'typescript',
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'nextjs' },
      update: {},
      create: {
        name: 'Next.js',
        slug: 'nextjs',
      },
    }),
  ])

  console.log('✅ Tags created:', tags.length)

  // Tạo site settings
  await prisma.siteSetting.upsert({
    where: { key: 'site_name' },
    update: {},
    create: {
      key: 'site_name',
      value: 'BlogVibe Coding',
    },
  })

  await prisma.siteSetting.upsert({
    where: { key: 'site_description' },
    update: {},
    create: {
      key: 'site_description',
      value: 'Viết chậm, học chăm, sống dịu dàng.',
    },
  })

  console.log('✅ Site settings created')

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

