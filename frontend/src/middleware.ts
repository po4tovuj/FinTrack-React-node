import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * Middleware to protect routes that require authentication
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    
    // Allow access to auth pages for unauthenticated users
    if (pathname.startsWith('/auth/')) {
      return NextResponse.next();
    }

    // Redirect authenticated users away from auth pages
    if (req.nextauth.token && pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Redirect to dashboard if accessing root
    if (pathname === '/' && req.nextauth.token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to public pages
        if (pathname === '/' || pathname.startsWith('/auth/')) {
          return true;
        }

        // Require authentication for all other pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     */
    '/((?!api|_next/static|_next/image).*)',
  ],
};