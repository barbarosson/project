import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Eski /edocuments adresi artık yok; tek e-belge sayfası /einvoice-center
  if (request.nextUrl.pathname === '/edocuments' || request.nextUrl.pathname.startsWith('/edocuments/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/einvoice-center';
    return NextResponse.redirect(url, 308);
  }

  const response = NextResponse.next();
  response.headers.set('X-Deployment-Version', 'v2-1739082650');
  response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/edocuments', '/edocuments/:path*'],
};
