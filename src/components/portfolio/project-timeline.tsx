'use client'

import { motion } from 'framer-motion'
import { Calendar, MapPin, ExternalLink, Github } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface TimelineItem {
  id: string
  title: string
  summary?: string | null
  description?: string | null
  timeline?: string | null
  role?: string | null
  technologies: string[]
  projectUrl?: string | null
  repoUrl?: string | null
  status?: 'completed' | 'ongoing' | 'planned'
}

interface ProjectTimelineProps {
  projects: TimelineItem[]
  className?: string
}

export function ProjectTimeline({ projects, className = '' }: ProjectTimelineProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
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
    <motion.div 
      className={`relative space-y-8 ${className}`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Timeline line */}
      <motion.div 
        className="absolute left-8 top-0 h-full w-0.5 bg-gradient-to-b from-ink-200 via-ink-300 to-ink-200 dark:from-ink-700 dark:via-ink-600 dark:to-ink-700"
        initial={{ height: 0 }}
        animate={{ height: "100%" }}
        transition={{ duration: 2, delay: 0.5 }}
      />
      
      {/* Timeline items */}
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          className="relative flex gap-8"
          variants={itemVariants}
        >
          {/* Timeline dot */}
          <motion.div 
            className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full glass-card border-white/20 bg-white/30 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
            whileHover={{ 
              scale: 1.2,
              rotate: 360,
              transition: { duration: 0.6 }
            }}
            variants={scaleVariants}
          >
            <motion.div
              className={`h-3 w-3 rounded-full ${
                project.status === 'completed' 
                  ? 'bg-green-500' 
                  : project.status === 'ongoing' 
                  ? 'bg-blue-500 animate-pulse'
                  : 'bg-gray-400'
              }`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: project.status === 'ongoing' ? [1, 0.6, 1] : 1
              }}
              transition={{
                duration: 2,
                repeat: project.status === 'ongoing' ? Infinity : 0,
                ease: "easeInOut"
              }}
            />
            
            {/* Status ring */}
            {(project.status === 'ongoing' || project.status === 'completed') && (
              <motion.div
                className="absolute inset-0 h-16 w-16 rounded-full border-2"
                style={{
                  borderColor: project.status === 'completed' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)'
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            )}
          </motion.div>

          {/* Project card */}
          <motion.div 
            className="flex-1 glass-card border-white/20 bg-white/30 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_25px_60px_rgba(31,38,135,0.25)] dark:border-white/10 dark:bg-white/10 dark:hover:shadow-[0_25px_60px_rgba(31,38,135,0.4)]"
            variants={itemVariants}
            whileHover={{ 
              y: -5,
              transition: { duration: 0.3 }
            }}
          >
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300">
                  {project.timeline && (
                    <motion.div 
                      className="flex items-center gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                    >
                      <Calendar className="h-3 w-3" />
                      {project.timeline}
                    </motion.div>
                  )}
                  {project.role && (
                    <motion.div 
                      className="flex items-center gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                    >
                      <MapPin className="h-3 w-3" />
                      {project.role}
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 + index * 0.1 }}
                  >
                    <Badge 
                      className={`glass-button border-white/10 backdrop-blur-lg ${
                        project.status === 'completed' 
                          ? 'bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20'
                          : project.status === 'ongoing'
                          ? 'bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20'
                          : 'bg-gray-500/20 text-gray-700 border-gray-500/30 dark:bg-gray-500/10 dark:text-gray-300 dark:border-gray-500/20'
                      }`}
                    >
                      {project.status === 'completed' ? 'Hoàn thành' : project.status === 'ongoing' ? 'Đang thực hiện' : 'Kế hoạch'}
                    </Badge>
                  </motion.div>
                </div>
                
                <motion.h3 
                  className="font-display text-xl text-ink-900 dark:text-ink-100"
                  whileHover={{ scale: 1.02 }}
                >
                  {project.title}
                </motion.h3>
                
                {project.summary && (
                  <motion.p 
                    className="text-sm text-ink-600 dark:text-ink-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    {project.summary}
                  </motion.p>
                )}
              </div>

              {/* Description */}
              {project.description && (
                <motion.p 
                  className="text-sm leading-relaxed text-ink-600 dark:text-ink-200 whitespace-pre-line"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 + index * 0.1 }}
                >
                  {project.description}
                </motion.p>
              )}

              {/* Technologies */}
              {project.technologies.length > 0 && (
                <motion.div 
                  className="flex flex-wrap gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                >
                  {project.technologies.map((tech) => (
                    <motion.div
                      key={tech}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Badge className="glass-button border-white/10 bg-white/10 px-2 py-1 text-xs backdrop-blur-lg dark:border-white/5 dark:bg-white/5">
                        {tech}
                      </Badge>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Action buttons */}
              <motion.div 
                className="flex flex-wrap gap-3 pt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 + index * 0.1 }}
              >
                {project.projectUrl && (
                  <Button asChild className="glass-button border-white/20 bg-white/20 hover:border-white/30 hover:bg-white/30 dark:border-white/10 dark:bg-white/10">
                    <a 
                      href={project.projectUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Xem sản phẩm
                    </a>
                  </Button>
                )}
                {project.repoUrl && (
                  <Button 
                    asChild 
                    variant="ghost" 
                    className="glass-button border-white/10 bg-white/10 hover:border-white/20 hover:bg-white/20 dark:border-white/5 dark:bg-white/5"
                  >
                    <a 
                      href={project.repoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Github className="h-4 w-4" />
                      Mã nguồn
                    </a>
                  </Button>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  )
}
