import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Define protected routes that require authentication
const PROTECTED_ROUTES = [
  '/profile',
  '/settings',
  '/chatrooms',
  '/messages',
  '/dashboard',
  '/user',
  '/api/protected',
  '/forum/new',
  // Add other protected routes here
];

// Routes that are public but have protected subpaths
const MIXED_ROUTES = [
  '/forum',
  '/api/users',
  // Add other mixed routes here
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip auth check for public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-otp')
  ) {
    return NextResponse.next();
  }

  // Check if the route requires authentication
  const requiresAuth = PROTECTED_ROUTES.some(route => pathname.startsWith(route)) ||
    MIXED_ROUTES.some(route => {
      // For mixed routes, check if it's a protected subpath
      if (pathname.startsWith(route) && pathname !== route) {
        // Specific check for /forum - only /forum/new and /forum/edit require auth
        if (route === '/forum') {
          return pathname.includes('/new') || pathname.includes('/edit');
        }
        // Add logic for other mixed routes as needed
        return true;
      }
      return false;
    });

  if (!requiresAuth) {
    return NextResponse.next();
  }

  // Get token from authorization header
  const authHeader = request.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  // If token not in header, check cookies (or localStorage via custom header)
  if (!token) {
    // Custom header for token from localStorage
    token = request.headers.get('x-auth-token');
  }

  if (!token) {
    // Redirect to login if no token is found
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // Verify JWT
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    jwt.verify(token, process.env.JWT_SECRET as string);
    
    // Token is valid, proceed to the route
    return NextResponse.next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Token is invalid, redirect to login
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  // Apply this middleware to all routes except static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|images).*)',
  ],
};