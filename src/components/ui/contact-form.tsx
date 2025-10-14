'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Send, CheckCircle, AlertCircle, User, MessageSquare, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/ui/cn'

interface ContactFormProps {
  className?: string
  onSubmit?: (data: ContactData) => Promise<void>
}

interface ContactData {
  name: string
  email: string
  subject: string
  message: string
  projectType?: string
}

interface FormErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
  projectType?: string
}

const projectTypes = [
  { value: 'web', label: 'Web Application', icon: '🌐' },
  { value: 'mobile', label: 'Mobile App', icon: '📱' },
  { value: 'api', label: 'API Development', icon: '⚡' },
  { value: 'ui', label: 'UI/UX Design', icon: '🎨' },
  { value: 'consulting', label: 'Technical Consulting', icon: '💡' },
  { value: 'other', label: 'Other', icon: '💭' }
]

export function ContactForm({ className = '', onSubmit }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    projectType: ''
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [charCount, setCharCount] = useState(0)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên của bạn'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tên phải có ít nhất 2 ký tự'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Vui lòng nhập chủ đề'
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = 'Chủ đề phải có ít nhất 3 ký tự'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Vui lòng nhập nội dung tin nhắn'
    } else if (formData.message.trim().length < 20) {
      newErrors.message = 'Tin nhắn phải có ít nhất 20 ký tự'
    } else if (formData.message.trim().length > 1000) {
      newErrors.message = 'Tin nhắn không được quá 1000 ký tự'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setSubmitStatus('idle')
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Call onSubmit if provided, otherwise simulate success
      if (onSubmit) {
        await onSubmit(formData)
      }
      
      setSubmitStatus('success')
      setSubmitMessage('Tin nhắn của bạn đã được gửi thành công! Tôi sẽ trả lời sớm nhất có thể.')
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        projectType: ''
      })
      setCharCount(0)
      
    } catch (error) {
      setSubmitStatus('error')
      setSubmitMessage('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof ContactData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    if (field === 'message') {
      setCharCount(value.length)
    }
  }

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const fieldVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  }

  return (
    <motion.div 
      className={cn("glass-card border-white/20 bg-white/30 p-8 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10", className)}
      initial="hidden"
      animate="visible"
      variants={formVariants}
    >
      <div className="space-y-6">
        {/* Header */}
        <motion.div 
          className="text-center space-y-2"
          variants={fieldVariants}
        >
          <motion.div
            className="inline-flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <Mail className="h-5 w-5 text-ink-600 dark:text-ink-400" />
            <h3 className="font-display text-2xl text-ink-900 dark:text-ink-100">
              Get In Touch
            </h3>
          </motion.div>
          <p className="text-ink-600 dark:text-ink-300">
            Let&apos;s build something amazing together. Drop me a message!
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Email row */}
          <div className="grid gap-4 md:grid-cols-2">
            <motion.div variants={fieldVariants}>
              <motion.div
                className={cn(
                  "glass-input border-white/20 bg-white/20 px-4 py-3 backdrop-blur-lg transition-all duration-300",
                  "hover:border-white/30 hover:bg-white/30",
                  focusedField === 'name' && 'border-white/40 bg-white/30',
                  errors.name && 'border-red-500/50 bg-red-50/20'
                )}
                whileFocus={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-ink-500 dark:text-ink-400" />
                  <label className="text-sm font-medium text-ink-700 dark:text-ink-200">
                    Name
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent text-ink-900 dark:text-ink-100 outline-none"
                  placeholder="Your name"
                  disabled={isSubmitting}
                />
              </motion.div>
              <AnimatePresence>
                {errors.name && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-1 mt-1 text-xs text-red-500"
                  >
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div variants={fieldVariants}>
              <motion.div
                className={cn(
                  "glass-input border-white/20 bg-white/20 px-4 py-3 backdrop-blur-lg transition-all duration-300",
                  "hover:border-white/30 hover:bg-white/30",
                  focusedField === 'email' && 'border-white/40 bg-white/30',
                  errors.email && 'border-red-500/50 bg-red-50/20'
                )}
                whileFocus={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4 text-ink-500 dark:text-ink-400" />
                  <label className="text-sm font-medium text-ink-700 dark:text-ink-200">
                    Email
                  </label>
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent text-ink-900 dark:text-ink-100 outline-none"
                  placeholder="your@email.com"
                  disabled={isSubmitting}
                />
              </motion.div>
              <AnimatePresence>
                {errors.email && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-1 mt-1 text-xs text-red-500"
                  >
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Project Type */}
          <motion.div variants={fieldVariants}>
            <motion.div
              className={cn(
                "glass-input border-white/20 bg-white/20 px-4 py-3 backdrop-blur-lg transition-all duration-300",
                "hover:border-white/30 hover:bg-white/30",
                focusedField === 'projectType' && 'border-white/40 bg-white/30'
              )}
              whileFocus={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4 text-ink-500 dark:text-ink-400" />
                <label className="text-sm font-medium text-ink-700 dark:text-ink-200">
                  Project Type
                </label>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {projectTypes.map((type) => (
                  <motion.div
                    key={type.value}
                    className={cn(
                      "cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition-all",
                      formData.projectType === type.value
                        ? "glass-button border-white/30 bg-white/40 text-ink-900 dark:border-white/20 dark:bg-white/20 dark:text-ink-50"
                        : "border-white/10 bg-white/10 text-ink-600 hover:border-white/20 hover:bg-white/20 dark:text-ink-400 dark:hover:text-ink-200"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleInputChange('projectType', type.value)}
                  >
                    <span className="mr-1">{type.icon}</span>
                    {type.label}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Subject */}
          <motion.div variants={fieldVariants}>
            <motion.div
              className={cn(
                "glass-input border-white/20 bg-white/20 px-4 py-3 backdrop-blur-lg transition-all duration-300",
                "hover:border-white/30 hover:bg-white/30",
                focusedField === 'subject' && 'border-white/40 bg-white/30',
                errors.subject && 'border-red-500/50 bg-red-50/20'
              )}
              whileFocus={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-ink-500 dark:text-ink-400" />
                <label className="text-sm font-medium text-ink-700 dark:text-ink-200">
                  Subject
                </label>
              </div>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                onFocus={() => setFocusedField('subject')}
                onBlur={() => setFocusedField(null)}
                className="w-full bg-transparent text-ink-900 dark:text-ink-100 outline-none"
                placeholder="What's this about?"
                disabled={isSubmitting}
              />
            </motion.div>
            <AnimatePresence>
              {errors.subject && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-1 mt-1 text-xs text-red-500"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.subject}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Message */}
          <motion.div variants={fieldVariants}>
            <motion.div
              className={cn(
                "glass-input border-white/20 bg-white/20 px-4 py-3 backdrop-blur-lg transition-all duration-300",
                "hover:border-white/30 hover:bg-white/30",
                focusedField === 'message' && 'border-white/40 bg-white/30',
                errors.message && 'border-red-500/50 bg-red-50/20'
              )}
              whileFocus={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-ink-500 dark:text-ink-400" />
                  <label className="text-sm font-medium text-ink-700 dark:text-ink-200">
                    Message
                  </label>
                </div>
                <span className={cn(
                  "text-xs transition-colors",
                  charCount > 800 ? "text-red-500" : "text-ink-500 dark:text-ink-400"
                )}>
                  {charCount}/1000
                </span>
              </div>
              <textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                onFocus={() => setFocusedField('message')}
                onBlur={() => setFocusedField(null)}
                className="w-full bg-transparent text-ink-900 dark:text-ink-100 outline-none resize-none"
                rows={6}
                placeholder="Tell me about your project, goals, or just say hi!"
                disabled={isSubmitting}
              />
            </motion.div>
            <AnimatePresence>
              {errors.message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-1 mt-1 text-xs text-red-500"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.message}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Submit Status Messages */}
          <AnimatePresence>
            {submitStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "p-4 rounded-lg flex items-center gap-2 text-sm",
                  submitStatus === 'success' 
                    ? "glass-card border-green-500/20 bg-green-50/20 dark:border-green-500/30 dark:bg-green-500/10 text-green-700 dark:text-green-300"
                    : "glass-card border-red-500/20 bg-red-50/20 dark:border-red-500/30 dark:bg-red-500/10 text-red-700 dark:text-red-300"
                )}
              >
                {submitStatus === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                {submitMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.div 
              className="flex justify-center"
              variants={fieldVariants}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="glass-button border-white/20 bg-white/20 px-8 py-3 text-base backdrop-blur-lg hover:border-white/30 hover:bg-white/30 disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:hover:border-white/20 dark:hover:bg-white/20"
                >
                <motion.div
                  className="flex items-center gap-2"
                  animate={isSubmitting ? { rotate: 360 } : {}}
                  transition={{ duration: 2, repeat: isSubmitting ? Infinity : 0, ease: "linear" }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-ink-600 border-t-transparent rounded-full" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </motion.div>
              </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </form>
      </div>
    </motion.div>
  )
}
