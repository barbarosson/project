import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { BETA_COOKIE_NAME } from '@/lib/beta-access'

function isBetaUnlocked(request: NextRequest): boolean {
  return request.cookies.get(BETA_COOKIE_NAME)?.value === '1'
}

function isPublicBetaPath(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname.startsWith('/login')) return true
  if (pathname.startsWith('/auth')) return true
  return false
}

function skipBetaMiddleware(pathname: string): boolean {
  if (pathname.startsWith('/_next')) return true
  if (pathname.startsWith('/api')) return true
  if (pathname.startsWith('/favicon')) return true
  // public klasöründeki statik dosyalar
  if (/\.(ico|png|jpg|jpeg|svg|gif|webp|woff2?|txt|xml|json|webmanifest)$/i.test(pathname)) {
    return true
  }
  return false
}

export async function middleware(request: NextRequest) {
  // Eski /edocuments adresi artık yok; tek e-belge sayfası /einvoice-center
  if (request.nextUrl.pathname === '/edocuments' || request.nextUrl.pathname.startsWith('/edocuments/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/einvoice-center'
    return NextResponse.redirect(url, 308)
  }

  const { pathname, search } = request.nextUrl

  if (skipBetaMiddleware(pathname)) {
    const response = NextResponse.next()
    response.headers.set('X-Deployment-Version', 'v2-1739082650')
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
    return response
  }

  if (!isPublicBetaPath(pathname) && !isBetaUnlocked(request)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    const returnTo = `${pathname}${search || ''}`
    url.searchParams.set('returnTo', returnTo)
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next()
  response.headers.set('X-Deployment-Version', 'v2-1739082650')
  response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image).*)',
  ],
}
