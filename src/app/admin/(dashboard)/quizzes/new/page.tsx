import { redirect } from 'next/navigation'

import { QuizForm } from '@/components/admin/quiz-form'
import { getCurrentSession } from '@/lib/auth/session'

export const metadata = {
  title: 'Tạo quiz mới',
}

export default async function CreateQuizPage() {
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/admin/sign-in')
  }

  return <QuizForm />
}
