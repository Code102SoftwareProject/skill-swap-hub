"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/context/ToastContext";

interface UseAdminAuthReturn {
  isAuthenticated: boolean | null;
  isLoading: boolean;
  error: string | null;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const router = useRouter();
  const { showToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create AbortController to cancel the fetch on unmount
    const abortController = new AbortController();

    const verifyAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Request to backend API to check admin authentication
        const res = await fetch("/api/admin/verify-auth", {
          credentials: "include", // Include cookies in request
          signal: abortController.signal, // Pass the abort signal
        });

        // Check if the request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        const data = await res.json();

        if (!res.ok || !data.authenticated) {
          const errorMessage = data.message || "Authentication failed";
          setError(errorMessage);

          // Show toast notification for the error
          showToast(errorMessage, "error");

          // Add a small delay before redirect to allow user to see the error
          setTimeout(() => {
            router.replace("/admin/login");
          }, 2000);
        } else {
          // Set authenticated state to true if verification successful
          setIsAuthenticated(true);
        }
      } catch (error: any) {
        // Don't handle aborted requests as errors
        if (error.name === "AbortError") {
          return;
        }

        const errorMessage =
          error.message || "Authentication verification failed";
        setError(errorMessage);

        // Show toast notification for the error
        showToast(`Authentication Error: ${errorMessage}`, "error");

        console.error("Auth verification error:", error);

        // Add a small delay before redirect to allow user to see the error
        setTimeout(() => {
          router.replace("/admin/login");
        }, 2000);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    verifyAuth();

    // Cleanup function to abort the fetch request if component unmounts
    return () => {
      abortController.abort();
    };
  }, [router, showToast]);

  return {
    isAuthenticated,
    isLoading,
    error,
  };
}
