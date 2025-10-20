import { notFound } from 'next/navigation'

import { WorkExperienceForm } from '@/components/admin/work-experience-form'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Chỉnh sửa kinh nghiệm làm việc',
}

type PageProps = {
  params: { id: string }
}

export default async function EditWorkExperiencePage({ params }: PageProps) {
  const experience = await prisma.workExperience.findUnique({
    where: { id: params.id },
  })

  if (!experience) {
    notFound()
  }

  return <WorkExperienceForm experience={experience} />
}

