import { ArrowUpRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SmartImage } from '@/components/ui/smart-image'
import { ContactForm } from '@/components/ui/contact-form'
import { PortfolioHero } from '@/components/portfolio/portfolio-hero'
import { ProjectTimeline } from '@/components/portfolio/project-timeline'
import { SkillProgress } from '@/components/portfolio/skill-progress'
import { createDynamicMetadata } from '@/lib/metadata'
import { resolveSitePreferences } from '@/server/settings'
import { getPortfolioProjects } from '@/server/portfolio'

export const revalidate = 60 // Revalidate every minute for faster updates

export async function generateMetadata() {
  return createDynamicMetadata({
    title: 'Portfolio',
    description:
      'Những dự án tiêu biểu thể hiện năng lực thiết kế, xây dựng sản phẩm và dẫn dắt kỹ thuật của tôi.',
    path: '/portfolio',
  })
}

const formatLinkLabel = (url: string) => {
  try {
    const { hostname } = new URL(url)
    return hostname.replace(/^www\./, '')
  } catch (error) {
    return url
  }
}

export default async function PortfolioPage() {
  const [preferences, projects] = await Promise.all([resolveSitePreferences(), getPortfolioProjects()])

  const slogan = preferences.slogan || 'Crafting calm experiences & resilient systems.'
  const intro =
    preferences.heroIntro ||
    'Kết hợp tư duy thiết kế, kỹ năng kỹ thuật và storytelling để tạo ra những sản phẩm hữu dụng, bền bỉ.'
  const heroCtaLabel = preferences.heroCtaLabel ?? 'Xem thêm dự án'
  const heroCtaLink = preferences.heroCtaLink ?? null
  const ownerProfile = preferences.owner ?? {}
  const ownerName = ownerProfile.name ?? 'Nhà sáng tạo ẩn danh'
  const avatarUrl = typeof ownerProfile.avatarUrl === 'string' && ownerProfile.avatarUrl.trim().length > 0 ? ownerProfile.avatarUrl.trim() : null
  const ownerInitials = ownerName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2)
  const ownerAgeLabel = ownerProfile.age ? `${ownerProfile.age} tuổi` : 'Luôn học hỏi'
  const totalProjects = projects.length
  const technologySet = new Set<string>()
  projects.forEach((project) => {
    project.technologies.forEach((tech) => technologySet.add(tech))
  })
  const featuredTechnologies = Array.from(technologySet).slice(0, 6)
  
  // Lấy thông tin học tập và chứng chỉ từ settings
  const education = preferences.education || 'Đại học Công nghệ'
  const certifications = preferences.certifications ?? []
  
  const metrics = [
    { label: 'Dự án hoàn thiện', value: totalProjects > 0 ? `${totalProjects}+` : 'Đang cập nhật' },
    {
      label: 'Công nghệ chủ đạo',
      value: featuredTechnologies.length > 0 ? featuredTechnologies.join(' • ') : 'Đa nền tảng',
    },
    { label: 'Quá trình học tập', value: education },
  ]
  const highlightCards = [
    {
      title: 'Trải nghiệm tinh gọn',
      body: 'Thiết kế flow rõ ràng, ưu tiên sự thông suốt và cảm giác nhẹ nhàng khi người dùng tương tác.',
    },
    {
      title: 'Kể chuyện bằng dữ liệu',
      body: 'Kết hợp phân tích và cảm xúc để truyền tải thông điệp, giúp sản phẩm tạo được kết nối bền vững.',
    },
    {
      title: 'Tư duy hệ thống',
      body: 'Xây dựng kiến trúc có thể mở rộng, tự động hoá quy trình và duy trì chất lượng dài hạn.',
    },
  ]
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'dotoan159@gmail.com'

  return (
    <main className="space-y-16">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-ink-100 bg-white/85 px-10 py-14 shadow-[0_28px_70px_rgba(33,38,94,0.14)] backdrop-blur-2xl dark:border-ink-700 dark:bg-ink-900/70 dark:shadow-[0_30px_70px_rgba(9,11,38,0.5)]">
        <div className="pointer-events-none absolute -left-10 top-0 h-56 w-56 rounded-full bg-ink-200/40 blur-3xl dark:bg-ink-600/30" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-ink-100/40 blur-[90px] dark:bg-ink-700/40" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="space-y-8">
            <Badge className="w-fit bg-ink-900 px-4 py-1 text-xs uppercase tracking-[0.3em] text-ink-50 dark:bg-ink-600">
              Portfolio cá nhân
            </Badge>
            <div className="space-y-4">
              <h1 className="font-display text-4xl leading-tight text-ink-900 dark:text-ink-50 md:text-[2.95rem]">
                {ownerName}
              </h1>
              <p className="text-lg text-ink-600 dark:text-ink-200">{intro}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-ink-200/60 bg-white/90 p-4 text-sm text-ink-500 shadow-[0_15px_35px_rgba(33,38,94,0.12)] transition hover:-translate-y-1 hover:border-ink-300 hover:text-ink-700 dark:border-ink-700/70 dark:bg-ink-800/70 dark:text-ink-300 dark:hover:border-ink-500"
                >
                  <p className="text-xs uppercase tracking-[0.35em] text-ink-400 dark:text-ink-500">{metric.label}</p>
                  <p className="mt-2 font-display text-xl text-ink-900 dark:text-ink-50">{metric.value}</p>
                </div>
              ))}
            </div>
            {featuredTechnologies.length ? (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">Kỹ năng chính</p>
                <div className="flex flex-wrap gap-2">
                  {featuredTechnologies.map((tech) => (
                    <Badge
                      key={tech}
                      className="border-ink-200 bg-white/60 text-ink-700 dark:border-ink-600 dark:bg-ink-800/60 dark:text-ink-100"
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
            {certifications.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">Chứng chỉ</p>
                <div className="flex flex-wrap gap-2">
                  {certifications.map((cert) => (
                    <Badge
                      key={cert}
                      className="border-ink-300 bg-ink-50/80 text-ink-800 dark:border-ink-500 dark:bg-ink-700/60 dark:text-ink-50"
                    >
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
            <p className="text-sm uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300">{slogan}</p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="relative aspect-square w-44 overflow-hidden rounded-[2rem] border border-ink-100/80 bg-gradient-to-br from-ink-200/60 via-ink-100/40 to-white/20 shadow-[0_25px_60px_rgba(33,38,94,0.14)] dark:border-ink-700/80 dark:from-ink-700/40 dark:via-ink-800/30 dark:to-ink-900/20 dark:shadow-[0_25px_60px_rgba(9,11,38,0.45)] sm:w-56">
              {avatarUrl ? (
                <SmartImage
                  src={avatarUrl}
                  alt={`Ảnh của ${ownerName}`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 224px, 176px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-200/60 via-white/40 to-ink-100/60 text-4xl font-semibold text-ink-500 dark:from-ink-700/40 dark:via-ink-900/40 dark:to-ink-800/40 dark:text-ink-200">
                  {ownerInitials || 'BV'}
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-white/40 shadow-[inset_0_0_20px_rgba(255,255,255,0.3)] dark:border-white/10" />
            </div>
            <div className="rounded-2xl border border-ink-100/70 bg-white/80 p-4 text-center shadow-[0_18px_45px_rgba(33,38,94,0.12)] dark:border-ink-700/70 dark:bg-ink-800/70 dark:text-ink-200">
              <p className="text-sm uppercase tracking-[0.35em] text-ink-400 dark:text-ink-500">Triết lý làm việc</p>
              <p className="mt-3 text-base leading-relaxed text-ink-700 dark:text-ink-100">
                “Thiết kế nên những trải nghiệm tinh tế, vận hành bởi hệ thống vững vàng và câu chuyện có chiều sâu.”
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {highlightCards.map((item) => (
          <Card
            key={item.title}
            className="border border-ink-100/70 bg-white/75 shadow-[0_18px_45px_rgba(33,38,94,0.1)] transition hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(33,38,94,0.15)] dark:border-ink-700/70 dark:bg-ink-900/60 dark:text-ink-100"
          >
            <CardHeader>
              <CardTitle className="text-lg text-ink-900 dark:text-ink-50">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-200">{item.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-10">
        <div className="space-y-2">
          <h2 className="font-display text-3xl text-ink-900 dark:text-ink-50">Dự án tiêu biểu</h2>
          <p className="text-sm text-ink-500 dark:text-ink-300">
            Mỗi dự án là một câu chuyện được kể qua sản phẩm số — từ chiến lược, nội dung đến trải nghiệm người dùng.
          </p>
        </div>
        {projects.length ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {projects.map((project) => (
              <Card key={project.id} id={project.slug} className="flex h-full flex-col overflow-hidden border border-ink-100/70 dark:border-ink-700/70">
                <CardHeader className="gap-3 border-b border-ink-100/70 bg-white/85 dark:border-ink-700/70 dark:bg-ink-900/60">
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300">
                    <span>{project.timeline ?? 'Thực hiện'}</span>
                    <span>•</span>
                    <span>{project.role ?? 'Vai trò đa nhiệm'}</span>
                  </div>
                  <CardTitle className="font-display text-2xl text-ink-900 dark:text-ink-50">{project.title}</CardTitle>
                  {project.summary ? (
                    <CardDescription className="text-sm text-ink-600 dark:text-ink-200">
                      {project.summary}
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-6 bg-white/70 py-6 dark:bg-ink-900/40">
                  {project.description ? (
                    <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-200 whitespace-pre-line">
                      {project.description}
                    </p>
                  ) : null}

                  {project.technologies.length ? (
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <Badge key={tech} className="bg-ink-100 text-ink-700 dark:bg-ink-700/70 dark:text-ink-100">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-auto flex flex-wrap gap-3">
                    {project.projectUrl ? (
                      <Button asChild variant="subtle">
                        <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                          Xem sản phẩm · {formatLinkLabel(project.projectUrl)}
                          <ArrowUpRight size={16} />
                        </a>
                      </Button>
                    ) : null}
                    {project.repoUrl ? (
                      <Button asChild variant="ghost">
                        <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                          Mã nguồn · {formatLinkLabel(project.repoUrl)}
                          <ArrowUpRight size={16} />
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-ink-200 bg-white/60 p-12 text-center text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-900/50 dark:text-ink-300">
            Portfolio đang được cập nhật. Vui lòng quay lại sau nhé.
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-ink-100 bg-white/85 p-10 text-center shadow-[0_20px_55px_rgba(33,38,94,0.12)] dark:border-ink-700 dark:bg-ink-900/70 dark:text-ink-200">
        <h3 className="font-display text-2xl text-ink-900 dark:text-ink-50">Cùng xây dựng dự án kế tiếp?</h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-200">
          Tôi luôn tò mò về những ý tưởng mới mẻ. Hãy chia sẻ thử thách của bạn, chúng ta sẽ cùng tạo nên trải nghiệm tử tế và khác biệt.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <a href={`mailto:${contactEmail}`}>
              Kết nối qua email
              <ArrowUpRight size={16} className="ml-1" />
            </a>
          </Button>
          {heroCtaLink ? (
            <Button
              asChild
              variant="ghost"
              className="border border-ink-200 bg-white/70 text-ink-700 hover:border-ink-300 dark:border-ink-700 dark:bg-ink-900/60 dark:text-ink-100"
            >
              <a href={heroCtaLink}>{heroCtaLabel}</a>
            </Button>
          ) : null}
        </div>
      </section>
    </main>
  )
}
