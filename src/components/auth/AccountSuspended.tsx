"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Home, RefreshCw } from "lucide-react";

interface SuspensionData {
  reason?: string;
  notes?: string;
  suspensionDate?: string;
  adminName?: string;
}

/**
 * AccountSuspended - A dedicated page component for displaying account suspension
 *
 * This component can be used as a full page or embedded in other components
 * when users attempt to access restricted features
 */
export default function AccountSuspended() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [suspensionData, setSuspensionData] = useState<SuspensionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get suspension data from URL params
    const reason = searchParams ? searchParams.get("reason") : null;
    const notes = searchParams ? searchParams.get("notes") : null;
    const date = searchParams ? searchParams.get("date") : null;
    const admin = searchParams ? searchParams.get("admin") : null;

    if (reason || notes || date) {
      setSuspensionData({
        reason: reason || undefined,
        notes: notes || undefined,
        suspensionDate: date || undefined,
        adminName: admin || undefined,
      });
    } else {
      // Try to get from localStorage if available
      const storedData = localStorage.getItem("suspensionData");
      if (storedData) {
        try {
          setSuspensionData(JSON.parse(storedData));
        } catch (error) {
          console.error("Error parsing suspension data:", error);
        }
      }
    }

    setIsLoading(false);
  }, [searchParams]);

  const handleReturnHome = () => {
    // Clear any stored suspension data
    localStorage.removeItem("suspensionData");
    router.push("/");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading account status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <Shield className="h-8 w-8 text-red-500" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Account Access Restricted
          </h1>
          <p className="text-lg text-gray-600">
            Your account has been suspended and access has been temporarily
            restricted.
          </p>
        </div>

       

        {/* Additional Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">What happens next?</CardTitle>
            <CardDescription>
              Here's what you can do while your account is suspended:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-900">Contact Support</p>
                  <p className="text-sm text-gray-600">
                    Reach out to our support team to discuss your suspension and
                    appeal the decision.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-900">
                    Review Terms of Service
                  </p>
                  <p className="text-sm text-gray-600">
                    Familiarize yourself with our community guidelines and terms
                    of service.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-900">
                    Wait for Resolution
                  </p>
                  <p className="text-sm text-gray-600">
                    Our team will review your case and provide updates via
                    email.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleReturnHome}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Return to Home
          </Button>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            If you believe this suspension was made in error, please contact our
            support team immediately.
          </p>
          <p className="mt-2">
            <a
              href="mailto:support@skillswaphub.com"
              className="text-blue-600 hover:text-blue-500 underline"
            >
              support@skillswaphub.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function to redirect to suspended page with suspension data
export const redirectToSuspendedPage = (suspensionData: SuspensionData) => {
  // Store data in localStorage for persistence
  localStorage.setItem("suspensionData", JSON.stringify(suspensionData));

  // Build URL with query parameters
  const params = new URLSearchParams();
  if (suspensionData.reason) params.set("reason", suspensionData.reason);
  if (suspensionData.notes) params.set("notes", suspensionData.notes);
  if (suspensionData.suspensionDate)
    params.set("date", suspensionData.suspensionDate);
  if (suspensionData.adminName) params.set("admin", suspensionData.adminName);

  const url = `/account-suspended${params.toString() ? `?${params.toString()}` : ""}`;
  window.location.href = url;
};
