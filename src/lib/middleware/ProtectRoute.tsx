'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/'];

interface ProtectRouteProps {
  children: ReactNode;
}

const ProtectRoute = ({ children }: ProtectRouteProps) => {
  const { user, token, isLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isRouteLoading, setIsRouteLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname || '') || 
                           pathname?.startsWith('/reset-password/') ||
                           pathname?.startsWith('/verify-otp/');
      
      // Get redirect path from URL if available
      const redirectPath = searchParams?.get('redirect');
      
      if (!token && !isPublicRoute) {
        // Show a message about the redirection
        showToast('Please log in to access this page', 'info');
        
        // Redirect to login with the current path as redirect parameter
        router.push(`/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : 
          pathname ? `?redirect=${encodeURIComponent(pathname)}` : ''}`);
      } else if (token && (pathname === '/login' || pathname === '/register')) {
        // If logged in and trying to access login/register, redirect to home or previous page
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.push('/');
        }
      } else {
        setIsRouteLoading(false);
      }
    }
  }, [isLoading, token, pathname, router, searchParams, showToast]);

  // Show loading state while checking auth
  if (isLoading || isRouteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectRoute;