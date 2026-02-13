import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set('X-Deployment-Version', 'v2-1739082650');
  response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');

  return response;
}

export const config = {
  matcher: '/admin/:path*',
};
