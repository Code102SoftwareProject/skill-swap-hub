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
    pathname.startsWith('/verify-otp') ||
    pathname === '/api/login' ||
    pathname === '/api/register'
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
    
    // If running in a browser context, we can also check cookies
    const cookies = request.cookies;
    if (!token && cookies.has('auth_token')) {
      token = cookies.get('auth_token')?.value || null;
    }
  }

  if (!token) {
    // For API requests, return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // For page requests, redirect to login
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
    
    // Add auth header to the request for downstream handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('Authorization', `Bearer ${token}`);
    
    // Clone the request with the new headers
    const newRequest = new NextRequest(request.url, {
      headers: requestHeaders,
      method: request.method,
      body: request.body,
      cache: request.cache,
      credentials: request.credentials,
      integrity: request.integrity,
      keepalive: request.keepalive,
      mode: request.mode,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
    });
    
    // Token is valid, proceed to the route
    return NextResponse.next({
      request: newRequest,
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // For API requests, return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // For page requests, redirect to login
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