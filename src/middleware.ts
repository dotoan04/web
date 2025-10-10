import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware() {
    return null
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname === '/admin/sign-in') {
          return true
        }
        return Boolean(token?.role && ['ADMIN', 'AUTHOR'].includes(token.role as string))
      },
    },
    pages: {
      signIn: '/admin/sign-in',
    },
  },
)

export const config = {
  matcher: ['/admin/:path*'],
}
