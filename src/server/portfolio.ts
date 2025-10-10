import { Prisma } from '@/generated/prisma'
import prisma from '@/lib/prisma'
import { slugify } from '@/lib/utils'

import type { PortfolioProjectInput } from '@/lib/validators/portfolio'

const normalizeTechnologies = (values?: string[]) =>
  Array.from(new Set((values ?? []).map((item) => item.trim()).filter(Boolean)))

const sanitizeUrl = (value?: string | null) => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed
}

export const getPortfolioProjects = async () => {
  try {
    return await prisma.portfolioProject.findMany({
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    })
  } catch (error) {
    console.error('Không thể tải danh sách portfolio:', error)
    return []
  }
}

export const getPortfolioProjectById = async (id: string) => {
  try {
    return await prisma.portfolioProject.findUnique({ where: { id } })
  } catch (error) {
    console.error('Không thể tải dự án portfolio:', error)
    return null
  }
}

export const createPortfolioProject = async (input: PortfolioProjectInput) => {
  const slug = input.slug ? slugify(input.slug) : slugify(input.title)

  return prisma.portfolioProject.create({
    data: {
      title: input.title.trim(),
      slug: slug || `du-an-${Date.now()}`,
      summary: input.summary?.trim() || null,
      description: input.description?.trim() || null,
      timeline: input.timeline?.trim() || null,
      role: input.role?.trim() || null,
      technologies: normalizeTechnologies(input.technologies),
      projectUrl: sanitizeUrl(input.projectUrl),
      repoUrl: sanitizeUrl(input.repoUrl),
      sortOrder: input.sortOrder ?? 0,
    },
  })
}

export const updatePortfolioProject = async (id: string, input: PortfolioProjectInput) => {
  const slug = input.slug ? slugify(input.slug) : slugify(input.title)

  return prisma.portfolioProject.update({
    where: { id },
    data: {
      title: input.title.trim(),
      slug: slug || `du-an-${Date.now()}`,
      summary: input.summary?.trim() || null,
      description: input.description?.trim() || null,
      timeline: input.timeline?.trim() || null,
      role: input.role?.trim() || null,
      technologies: normalizeTechnologies(input.technologies),
      projectUrl: sanitizeUrl(input.projectUrl),
      repoUrl: sanitizeUrl(input.repoUrl),
      sortOrder: input.sortOrder ?? 0,
    },
  })
}

export const deletePortfolioProject = async (id: string) => {
  try {
    await prisma.portfolioProject.delete({ where: { id } })
    return true
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return false
    }
    console.error('Không thể xoá dự án portfolio:', error)
    throw error
  }
}
