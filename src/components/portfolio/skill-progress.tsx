'use client'

import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'

interface Skill {
  name: string
  level: number
  category: 'frontend' | 'backend' | 'tools' | 'soft'
  experience?: string
  projects?: number
}

interface SkillProgressProps {
  skills: Skill[]
  animated?: boolean
  className?: string
}

export function SkillProgress({ 
  skills, 
  animated = false, 
  className = '' 
}: SkillProgressProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.9", "end 0.2"]
  })

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  const categoryColors = {
    frontend: 'from-blue-500 to-cyan-400',
    backend: 'from-green-500 to-emerald-400',
    tools: 'from-purple-500 to-pink-400',
    soft: 'from-orange-500 to-yellow-400'
  }

  const categoryIcons = {
    frontend: '🎨',
    backend: '⚡',
    tools: '🔧',
    soft: '💡'
  }

  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, Skill[]>)

  return (
    <div ref={containerRef} className={`space-y-8 ${className}`}>
      {Object.entries(skillsByCategory).map(([category, categorySkills], categoryIndex) => (
        <motion.div
          key={category}
          className="space-y-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: categoryIndex * 0.2 }}
        >
          {/* Category header */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            whileHover={{ x: 10 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-2xl">{categoryIcons[category as keyof typeof categoryIcons]}</span>
            <h3 className="font-display text-xl text-ink-900 dark:text-ink-100 capitalize">
              {category === 'frontend' ? 'Frontend & Design' : 
               category === 'backend' ? 'Backend & Systems' : 
               category === 'tools' ? 'Tools & DevOps' : 'Skills & Mindset'}
            </h3>
            <Badge className="glass-button border-white/10 bg-white/20 backdrop-blur-lg">
              {categorySkills.length} skills
            </Badge>
          </motion.div>

          {/* Skills in category */}
          <div className="grid gap-4 md:grid-cols-2">
            {categorySkills.map((skill, skillIndex) => {
              const isHovered = hoveredSkill === skill.name
              
              return (
                <motion.div
                  key={skill.name}
                  className="glass-card border-white/20 bg-white/30 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: categoryIndex * 0.2 + skillIndex * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 20px 60px rgba(31,38,135,0.25)"
                  }}
                  onHoverStart={() => setHoveredSkill(skill.name)}
                  onHoverEnd={() => setHoveredSkill(null)}
                >
                  <div className="space-y-3">
                    {/* Skill header */}
                    <div className="flex items-center justify-between">
                      <motion.div 
                        className="flex-1"
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h4 className="font-medium text-ink-900 dark:text-ink-100">
                          {skill.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
                          {skill.experience && (
                            <span>{skill.experience}</span>
                          )}
                          {skill.projects && (
                            <span>• {skill.projects} projects</span>
                          )}
                        </div>
                      </motion.div>
                      
                      <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + skillIndex * 0.1 }}
                      >
                        <motion.div
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.3))`,
                            backdropFilter: 'blur(10px)'
                          }}
                          whileHover={{ scale: 1.1 }}
                        >
                          {skill.level}%
                        </motion.div>
                      </motion.div>
                    </div>

                    {/* Progress bar */}
                    <div className="relative h-3 overflow-hidden rounded-full glass-card border-white/10 bg-white/20 backdrop-blur-lg dark:border-white/5 dark:bg-white/10">
                      {/* Animated background gradient */}
                      {isHovered && (
                        <motion.div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`
                          }}
                          animate={{
                            x: ['-100%', '100%']
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />
                      )}
                      
                      {/* Progress fill */}
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${getCategoryGradient(category, 0.8)}, ${getCategoryGradient(category, 0.6)})`
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.level}%` }}
                        transition={{
                          duration: 1.5,
                          delay: 0.5 + skillIndex * 0.1,
                          ease: "easeOut"
                        }}
                      />
                      
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute top-0 left-0 h-full w-full"
                        style={{
                          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                          WebkitMaskImage: `linear-gradient(90deg, transparent, black, transparent)`,
                          maskImage: `linear-gradient(90deg, transparent, black, transparent)`
                        }}
                        animate={{
                          x: ['-200%', '200%']
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: Math.random() * 3,
                          ease: "linear"
                        }}
                      />
                    </div>

                    {/* Skill details on hover */}
                    {isHovered && (
                      <motion.div
                        className="mt-2 p-2 rounded-lg glass-card border-white/10 bg-white/20 backdrop-blur-lg"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-xs text-ink-600 dark:text-ink-200">
                          {getSkillDescription(skill)}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      ))}

      {/* Scroll progress indicator for animated mode */}
      {animated && (
        <motion.div
          className="fixed bottom-8 left-8 z-50 h-1 w-20 glass-card border-white/20 bg-white/20 backdrop-blur-lg"
          style={{ scaleX }}
        />
      )}
    </div>
  )
}

function getCategoryGradient(category: string, opacity: number): string {
  const colors = {
    frontend: `rgba(59, 130, 246, ${opacity})`,
    backend: `rgba(34, 197, 94, ${opacity})`,
    tools: `rgba(168, 85, 247, ${opacity})`,
    soft: `rgba(251, 146, 60, ${opacity})`
  }
  return colors[category as keyof typeof colors] || `rgba(107, 114, 128, ${opacity})`
}

function getSkillDescription(skill: Skill): string {
  const descriptions: Record<string, string> = {
    'React': 'Modern UI development with hooks, context, and performance optimization',
    'TypeScript': 'Type-safe development with advanced types and interfaces',
    'Next.js': 'Full-stack React framework with SSR, SSG, and API routes',
    'Tailwind CSS': 'Utility-first CSS with custom designs and responsive layouts',
    'Node.js': 'Server-side JavaScript with Express, APIs, and real-time applications',
    'PostgreSQL': 'Relational database design, queries, and optimization',
    'Prisma': 'Modern ORM with type-safe database operations and migrations',
    'Docker': 'Containerization and orchestration for development and deployment',
    'Git': 'Version control, branching strategies, and collaborative workflows',
  }
  
  return descriptions[skill.name] || `${skill.level}% proficiency level`
}
