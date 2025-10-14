'use client'

import { useState } from 'react'
import { Mail, Send, CheckCircle, AlertCircle, User, MessageSquare, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/ui/cn'

interface ContactFormProps {
  className?: string
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

export function ContactForm({ className = '' }: ContactFormProps) {
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
      newErrors.name = 'Please enter your name'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Please enter a subject'
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Please enter your message'
    } else if (formData.message.trim().length < 20) {
      newErrors.message = 'Message must be at least 20 characters'
    } else if (formData.message.trim().length > 1000) {
      newErrors.message = 'Message cannot exceed 1000 characters'
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
      
      // Handle form submission (you can integrate with your service here)
      console.log('Contact form submitted:', formData)
      console.log('Here you would integrate with your preferred service:')
      console.log('- Email service (Resend, Mailgun, SendGrid)')
      console.log('- Form service (Formspree, Netlify Forms, Tally)')
      
      setSubmitStatus('success')
      setSubmitMessage('Your message has been sent successfully! I\'ll get back to you soon.')
      
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
      setSubmitMessage('An error occurred while sending your message. Please try again later.')
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

  return (
    <div className={cn("glass-card border-white/20 bg-white/30 p-8 backdrop-blur-2xl dark:border-white/10 dark:bg-white/10", className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <Mail className="h-5 w-5 text-ink-600 dark:text-ink-400" />
            <h3 className="font-display text-2xl text-ink-900 dark:text-ink-100">
              Get In Touch
            </h3>
          </div>
          <p className="text-ink-600 dark:text-ink-300">
            Let&apos;s build something amazing together. Drop me a message!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Email row */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div
                className={cn(
                  "glass-input border-white/20 bg-white/20 px-4 py-3 backdrop-blur-lg transition-all duration-300",
                  "hover:border-white/30 hover:bg-white/30",
                  focusedField === 'name' && 'border-white/40 bg-white/30',
                  errors.name && 'border-red-500/50 bg-red-50/20'
                )}
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
              </div>
              {errors.name && (
                <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </div>
              )}
            </div>

            <div>
              <div
                className={cn(
                  "glass-input border-white/20 bg-white/20 px-4 py-3 backdrop-blur-lg transition-all duration-300",
                  "hover:border-white/30 hover:bg-white/30",
                  focusedField === 'email' && 'border-white/40 bg-white/30',
                  errors.email && 'border-red-500/50 bg-red-50/20'
                )}
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
              </div>
              {errors.email && (
                <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </div>
              )}
            </div>
          </div>

          {/* Project Type */}
          <div>
            <div
              className={cn(
                "glass-input border-white/20 bg-white/20 px-4 py-3 backdrop-blur-lg transition-all duration-300",
                "hover:border-white/30 hover:bg-white/30",
                focusedField === 'projectType' && 'border-white/40 bg-white/30'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4 text-ink-500 dark:text-ink-400" />
                <label className="text-sm font-medium text-ink-700 dark:text-ink-200">
                  Project Type
                </label>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {projectTypes.map((type) => (
                  <div
                    key={type.value}
                    className={cn(
                      "cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition-all",
                      formData.projectType === type.value
                        ? "glass-button border-white/30 bg-white/40 text-ink-900 dark:border-white/20 dark:bg-white/20 dark:text-ink-50"
                        : "border-white/10 bg-white/10 text-ink-600 hover:border-white/20 hover:bg-white/20 dark:text-ink-400 dark:hover:text-ink-200"
                    )}
                    onClick={() => handleInputChange('projectType', type.value)}
                  >
                    <span className="mr-1">{type.icon}</span>
                    {type.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <div
              className={cn(
                "glass-input border-white/20 bg-white/20 px-4 py-3 backdrop-blur-lg transition-all duration-300",
                "hover:border-white/30 hover:bg-white/30",
                focusedField === 'subject' && 'border-white/40 bg-white/30',
                errors.subject && 'border-red-500/50 bg-red-50/20'
              )}
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
            </div>
            {errors.subject && (
              <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                {errors.subject}
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <div
              className={cn(
                "glass-input border-white/20 bg-white/20 px-4 py-3 backdrop-blur-lg transition-all duration-300",
                "hover:border-white/30 hover:bg-white/30",
                focusedField === 'message' && 'border-white/40 bg-white/30',
                errors.message && 'border-red-500/50 bg-red-50/20'
              )}
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
            </div>
            {errors.message && (
              <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                {errors.message}
              </div>
            )}
          </div>

          {/* Submit Status Messages */}
          {submitStatus !== 'idle' && (
            <div
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
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="glass-button border-white/20 bg-white/20 px-8 py-3 text-base backdrop-blur-lg hover:border-white/30 hover:bg-white/30 disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:hover:border-white/20 dark:hover:bg-white/20"
            >
              <div className="flex items-center gap-2">
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
              </div>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
