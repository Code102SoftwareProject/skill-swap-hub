'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/'];

interface ProtectRouteProps {
  children: ReactNode;
}

const ProtectRoute = ({ children }: ProtectRouteProps) => {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRouteLoading, setIsRouteLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname || '') || 
                           pathname?.startsWith('/reset-password/');
                           
      if (!token && !isPublicRoute) {
        // Redirect to login if no token and route requires auth
        router.push('/login');
      } else if (token && (pathname === '/login' || pathname === '/register')) {
        // Redirect to home if logged in and trying to access login/register
        router.push('/');
      } else {
        setIsRouteLoading(false);
      }
    }
  }, [isLoading, token, pathname, router]);

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