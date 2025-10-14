import { ArrowUpRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
    title: 'Enhanced Portfolio',
    description: 'Interactive portfolio showcasing technical skills, project timeline, and professional experience.',
    path: '/portfolio-new',
  })
}

export default async function EnhancedPortfolioPage() {
  const [preferences, projects] = await Promise.all([
    resolveSitePreferences(), 
    getPortfolioProjects()
  ])

  const slogan = preferences.slogan || 'Crafting calm experiences & resilient systems.'
  const intro = preferences.heroIntro || 'Kết hợp tư duy thiết kế, kỹ năng kỹ thuật và storytelling để tạo ra những sản phẩm hữu dụng, bền bỉ.'
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
  
  // Enhanced skills data for progress bars
  const enhancedSkills = [
    // Frontend
    { name: 'React', level: 90, category: 'frontend' as const, experience: '4 years', projects: 15 },
    { name: 'TypeScript', level: 85, category: 'frontend' as const, experience: '3 years', projects: 12 },
    { name: 'Next.js', level: 88, category: 'frontend' as const, experience: '3 years', projects: 8 },
    { name: 'Tailwind CSS', level: 92, category: 'frontend' as const, experience: '3 years', projects: 18 },
    // Backend
    { name: 'Node.js', level: 82, category: 'backend' as const, experience: '3 years', projects: 6 },
    { name: 'PostgreSQL', level: 78, category: 'backend' as const, experience: '2 years', projects: 5 },
    { name: 'Prisma', level: 85, category: 'backend' as const, experience: '2 years', projects: 7 },
    // Tools
    { name: 'Git', level: 88, category: 'tools' as const, experience: '4 years', projects: 25 },
    { name: 'Docker', level: 75, category: 'tools' as const, experience: '1 year', projects: 3 },
    { name: 'Figma', level: 80, category: 'tools' as const, experience: '2 years', projects: 8 },
    // Soft Skills
    { name: 'UI/UX Design', level: 85, category: 'soft' as const, experience: '3 years', projects: 12 },
    { name: 'System Design', level: 78, category: 'soft' as const, experience: '2 years', projects: 5 },
    { name: 'Team Leadership', level: 82, category: 'soft' as const, experience: '2 years', projects: 8 },
  ]

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'dotoan159@gmail.com'

  return (
    <main className="space-y-16">
      <PortfolioHero
        ownerName={ownerName}
        intro={intro}
        avatarUrl={avatarUrl}
        featuredTechnologies={featuredTechnologies}
        totalProjects={totalProjects}
        slogan={slogan}
        ownerProfile={ownerProfile}
        education={education}
      />

      {/* Technical Skills Section */}
      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="font-display text-3xl text-ink-900 dark:text-ink-50">Technical Skills</h2>
          <p className="text-sm text-ink-500 dark:text-ink-300">
            A comprehensive overview of my technical expertise and hands-on experience.
          </p>
        </div>
        <SkillProgress skills={enhancedSkills} animated={true} />
      </section>

      {/* Project Timeline Section */}
      <section className="space-y-10">
        <div className="space-y-2">
          <h2 className="font-display text-3xl text-ink-900 dark:text-ink-50">Project Timeline</h2>
          <p className="text-sm text-ink-500 dark:text-ink-300">
            A chronological journey through my projects and experiences.
          </p>
        </div>
        <ProjectTimeline 
          projects={projects.map(project => ({
            ...project,
            status: project.timeline?.toLowerCase().includes('hoàn thành') ? 'completed' as const :
                   project.timeline?.toLowerCase().includes('đang') ? 'ongoing' as const : 
                   'planned' as const
          }))}
        />
      </section>

      {/* Traditional Grid View (Optional - can be removed) */}
      {projects.length > 0 && (
        <section className="space-y-10">
          <div className="space-y-2">
            <h2 className="font-display text-3xl text-ink-900 dark:text-ink-50">Featured Projects</h2>
            <p className="text-sm text-ink-500 dark:text-ink-300">
              Key projects that demonstrate my capabilities and experience.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {projects.slice(0, 4).map((project, index) => (
              <div key={project.id} className="glass-card glass-hover border-white/20 bg-white/30 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300">
                    <span>{project.timeline ?? 'Thực hiện'}</span>
                    <span>•</span>
                    <span>{project.role ?? 'Vai trò đa nhiệm'}</span>
                  </div>
                  <h3 className="font-display text-2xl text-ink-900 dark:text-ink-50">{project.title}</h3>
                  {project.summary && (
                    <p className="text-sm text-ink-600 dark:text-ink-200">{project.summary}</p>
                  )}
                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.slice(0, 5).map((tech) => (
                        <Badge key={tech} className="glass-button border-white/10 bg-white/10">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="font-display text-3xl text-ink-900 dark:text-ink-50">Let&apos;s Connect</h2>
          <p className="text-sm text-ink-500 dark:text-ink-300">
            Have a project in mind? Let&apos;s collaborate and create something amazing together.
          </p>
        </div>
        <ContactForm />
      </section>

      {/* Quick Contact */}
      <section className="glass-card glass-hover border-white/20 bg-white/30 p-8 text-center shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
        <h3 className="font-display text-2xl text-ink-900 dark:text-ink-50">Quick Contact</h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-200">
          Alternatively, you can reach out directly via email.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="glass-button border-white/20 bg-white/20 hover:border-white/30 hover:bg-white/30 dark:border-white/10 dark:bg-white/10">
            <a href={`mailto:${contactEmail}`}>
              <ArrowUpRight size={16} className="mr-2" />
              Email me directly
            </a>
          </Button>
        </div>
      </section>
    </main>
  )
}
