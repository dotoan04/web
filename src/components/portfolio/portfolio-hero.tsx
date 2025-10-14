'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { SmartImage } from '@/components/ui/smart-image'
import { Github, Mail, Globe, Zap, Code, Palette, Database } from 'lucide-react'

interface PortfolioHeroProps {
  ownerName: string
  intro: string
  avatarUrl?: string | null
  featuredTechnologies: string[]
  totalProjects: number
  slogan: string
  ownerProfile?: any
  education?: string
}

export function PortfolioHero({
  ownerName,
  intro,
  avatarUrl,
  featuredTechnologies,
  totalProjects,
  slogan,
  ownerProfile,
  education
}: PortfolioHeroProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [activeSkillIndex, setActiveSkillIndex] = useState(0)
  const ownerInitials = ownerName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2)

  // Auto-rotate skills showcase
  useEffect(() => {
    if (featuredTechnologies.length === 0) return
    const interval = setInterval(() => {
      setActiveSkillIndex((prev) => (prev + 1) % featuredTechnologies.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [featuredTechnologies])

  const skillIcons: Record<string, React.ReactNode> = {
    'react': <Code className="h-4 w-4" />,
    'next.js': <Globe className="h-4 w-4" />,
    'typescript': <Code className="h-4 w-4" />,
    'node.js': <Database className="h-4 w-4" />,
    'tailwind': <Palette className="h-4 w-4" />,
    'default': <Zap className="h-4 w-4" />
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 20
      }
    }
  }

  const scaleVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  }

  return (
    <motion.section 
      className="relative overflow-hidden glass-card border-white/20 bg-white/30 px-10 py-14 shadow-[0_28px_70px_rgba(31,38,135,0.25)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_70px_rgba(31,38,135,0.45)]"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Animated background elements */}
      <motion.div 
        className="pointer-events-none absolute -left-10 top-0 h-56 w-56 rounded-full bg-ink-200/40 blur-3xl dark:bg-ink-600/30 liquid-blob"
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      />
      <motion.div 
        className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-ink-100/40 blur-[90px] dark:bg-ink-700/40 liquid-blob"
        animate={{ 
          scale: [1.2, 1, 1.2],
          rotate: [360, 180, 0],
        }}
        transition={{ 
          duration: 25, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      />

      <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <motion.div 
          className="space-y-8"
          variants={itemVariants}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Badge className="w-fit glass-button border-white/20 bg-white/20 px-4 py-1 text-xs uppercase tracking-[0.3em] backdrop-blur-lg">
              Portfolio cá nhân
            </Badge>
          </motion.div>

          <div className="space-y-4">
            <motion.h1 
              className="font-display text-4xl leading-tight text-ink-900 dark:text-ink-50 md:text-[2.95rem]"
              variants={itemVariants}
            >
              {ownerName.split(' ').map((word, index) => (
                <motion.span
                  key={index}
                  className="inline-block"
                  whileHover={{ 
                    scale: 1.05, 
                    color: "var(--color-ink-600)",
                    transition: { duration: 0.2 }
                  }}
                >
                  {word}
                  {index < ownerName.split(' ').length - 1 && ' '}
                </motion.span>
              ))}
            </motion.h1>
            <motion.p 
              className="text-lg text-ink-600 dark:text-ink-200"
              variants={itemVariants}
            >
              {intro}
            </motion.p>
          </div>

          {/* Animated Metrics */}
          <motion.div 
            className="grid gap-4 sm:grid-cols-3"
            variants={itemVariants}
          >
            {[
              { label: 'Dự án hoàn thiện', value: totalProjects > 0 ? `${totalProjects}+` : 'Đang cập nhật' },
              { label: 'Công nghệ chủ đạo', value: featuredTechnologies.length > 0 ? featuredTechnologies.join(' • ') : 'Đa nền tảng' },
              { label: 'Quá trình học tập', value: education || 'Đại học Công nghệ' },
            ].map((metric, index) => (
              <motion.div
                key={metric.label}
                className="glass-card border-white/20 bg-white/30 p-4 text-sm backdrop-blur-lg transition hover:scale-[1.02] dark:border-white/10 dark:bg-white/10"
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 20px 60px rgba(31,38,135,0.3)"
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <p className="text-xs uppercase tracking-[0.35em] text-ink-400 dark:text-ink-500">
                  {metric.label}
                </p>
                <motion.p 
                  className="mt-2 font-display text-xl text-ink-900 dark:text-ink-50"
                  whileHover={{ scale: 1.05 }}
                >
                  {metric.value}
                </motion.p>
              </motion.div>
            ))}
          </motion.div>

          {/* Animated Technologies */}
          {featuredTechnologies.length > 0 && (
            <motion.div 
              className="space-y-3"
              variants={itemVariants}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">
                Kỹ năng chính
              </p>
              <div className="flex flex-wrap gap-2">
                {featuredTechnologies.map((tech, index) => {
                  const IconComponent = skillIcons[tech.toLowerCase()] || skillIcons.default
                  return (
                    <motion.div
                      key={tech}
                      className="relative"
                      onMouseEnter={() => setActiveSkillIndex(index)}
                      animate={{
                        scale: activeSkillIndex === index ? 1.1 : 1,
                        zIndex: activeSkillIndex === index ? 10 : 1
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <Badge 
                        className={`glass-button border-white/10 bg-white/20 px-3 py-1 backdrop-blur-lg transition-all duration-300 ${
                          activeSkillIndex === index 
                            ? 'border-white/30 bg-white/30 shadow-lg' 
                            : 'border-white/20 bg-white/10'
                        }`}
                      >
                        <span className="mr-1">{IconComponent}</span>
                        {tech}
                      </Badge>
                      {activeSkillIndex === index && (
                        <motion.div
                          className="absolute -bottom-2 left-1/2 h-1 w-1/3 bg-ink-400 rounded-full"
                          layoutId="activeSkill"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          <motion.p 
            className="text-sm uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300"
            variants={itemVariants}
          >
            {slogan}
          </motion.p>
        </motion.div>

        {/* Interactive Avatar Card */}
        <motion.div 
          className="flex flex-col items-center gap-6"
          variants={itemVariants}
        >
          <motion.div 
            className="relative aspect-square w-44 overflow-hidden rounded-[2rem] border border-white/20 glass-card bg-gradient-to-br from-ink-200/60 via-ink-100/40 to-white/20 shadow-[0_25px_60px_rgba(31,38,135,0.25)] backdrop-blur-2xl dark:border-white/10 dark:from-ink-700/40 dark:via-ink-800/30 dark:to-ink-900/20 dark:shadow-[0_25px_60px_rgba(31,38,135,0.45)] sm:w-56"
            whileHover={{ 
              scale: 1.05, 
              rotate: [0, -2, 2, 0],
              transition: { duration: 0.5 }
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
          >
            {avatarUrl ? (
              <SmartImage
                src={avatarUrl}
                alt={`Ảnh của ${ownerName}`}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 224px, 176px"
              />
            ) : (
              <motion.div 
                className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-200/60 via-white/40 to-ink-100/60 text-4xl font-semibold text-ink-500 dark:from-ink-700/40 dark:via-ink-900/40 dark:to-ink-800/40 dark:text-ink-200"
                animate={isHovered ? {
                  scale: [1, 1.1, 1],
                  filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"]
                } : {}}
                transition={{ duration: 3 }}
              >
                {ownerInitials || 'BV'}
              </motion.div>
            )}
            
            {/* Animated border overlay */}
            <motion.div 
              className="pointer-events-none absolute inset-0 rounded-[2rem] border border-white/40 shadow-[inset_0_0_20px_rgba(255,255,255,0.3)] dark:border-white/10"
              animate={{
                boxShadow: isHovered 
                  ? ["inset_0_0_20px_rgba(255,255,255,0.3)", "inset_0_0_30px_rgba(255,255,255,0.5)", "inset_0_0_20px_rgba(255,255,255,0.3)"]
                  : []
              }}
              transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
            />

            {/* Floating particles */}
            {isHovered && (
              <div className="absolute inset-0">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-1 w-1 rounded-full bg-white/60 dark:bg-white/30"
                    initial={{ 
                      x: Math.random() * 100, 
                      y: Math.random() * 100,
                      opacity: 0 
                    }}
                    animate={{
                      y: [-100, 200],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0.5]
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>

          <motion.div 
            className="glass-card border-white/20 bg-white/30 p-4 text-center backdrop-blur-lg shadow-[0_18px_45px_rgba(31,38,135,0.15)] dark:border-white/10 dark:bg-white/10 dark:shadow-[0_18px_45px_rgba(31,38,135,0.25)]"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-sm uppercase tracking-[0.35em] text-ink-400 dark:text-ink-500">
              Triết lý làm việc
            </p>
            <motion.p 
              className="mt-3 text-base leading-relaxed text-ink-700 dark:text-ink-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
            >
              &quot;Thiết kế nên những trải nghiệm tinh tế, vận hành bởi hệ thống vững vàng và câu chuyện có chiều sâu.&quot;
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  )
}
