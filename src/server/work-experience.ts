import { Prisma } from '@/generated/prisma'
import prisma from '@/lib/prisma'

import type { WorkExperienceInput } from '@/lib/validators/work-experience'

export const getWorkExperiences = async () => {
  try {
    return await prisma.workExperience.findMany({
      orderBy: [{ sortOrder: 'asc' }, { startDate: 'desc' }],
    })
  } catch (error) {
    console.error('Không thể tải danh sách kinh nghiệm làm việc:', error)
    return []
  }
}

export const getWorkExperienceById = async (id: string) => {
  try {
    return await prisma.workExperience.findUnique({ where: { id } })
  } catch (error) {
    console.error('Không thể tải kinh nghiệm làm việc:', error)
    return null
  }
}

export const createWorkExperience = async (input: WorkExperienceInput) => {
  return prisma.workExperience.create({
    data: {
      company: input.company.trim(),
      position: input.position.trim(),
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      isCurrent: input.isCurrent ?? false,
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      sortOrder: input.sortOrder ?? 0,
    },
  })
}

export const updateWorkExperience = async (id: string, input: WorkExperienceInput) => {
  return prisma.workExperience.update({
    where: { id },
    data: {
      company: input.company.trim(),
      position: input.position.trim(),
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      isCurrent: input.isCurrent ?? false,
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      sortOrder: input.sortOrder ?? 0,
    },
  })
}

export const deleteWorkExperience = async (id: string) => {
  try {
    await prisma.workExperience.delete({ where: { id } })
    return true
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return false
    }
    console.error('Không thể xoá kinh nghiệm làm việc:', error)
    throw error
  }
}

