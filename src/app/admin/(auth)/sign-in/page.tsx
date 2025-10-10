import type { Metadata } from 'next'
import Link from 'next/link'

import { SignInForm } from '@/components/admin/sign-in-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Đăng nhập quản trị | BlogVibe',
}

export default function AdminSignInPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Xin chào!</CardTitle>
          <CardDescription>
            Đăng nhập để viết bài, quản lý nội dung và vận hành BlogVibe Coding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
          <p className="text-center text-xs text-ink-400">
            Quên mật khẩu? Hãy liên hệ quản trị viên hệ thống để được hỗ trợ.
          </p>
          <Link className="text-center text-sm text-ink-600 underline" href="/">
            ↩ Trở về trang chủ
          </Link>
        </CardContent>
      </Card>
    </section>
  )
}
