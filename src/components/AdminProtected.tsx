"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AdminProtected({
  children,
}: {
  children: React.ReactNode;
}) {
  // Router instance for navigation
  const router = useRouter();
  // Track authentication state - null (loading), true (authenticated), false (not authenticated)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  // Ref to track component mount state to prevent state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    // Mark component as mounted
    isMounted.current = true;

    // Function to verify admin authentication status
    const verifyAuth = async () => {
      try {
        // Request to backend API to check admin authentication
        const res = await fetch("/api/admin/verify-auth", {
          credentials: "include", // Include cookies in request
        });

        const data = await res.json();

        // Only update state if component is still mounted
        if (isMounted.current) {
          if (!res.ok || !data.authenticated) {
            // Redirect to login page if not authenticated
            router.replace("/admin/login");
          } else {
            // Set authenticated state to true if verification successful
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        if (isMounted.current) {
          console.error("Auth verification error:", error);
          router.replace("/admin/login");
        }
      }
    };

    verifyAuth();

    return () => {
      isMounted.current = false;
    };
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-3 text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
}
