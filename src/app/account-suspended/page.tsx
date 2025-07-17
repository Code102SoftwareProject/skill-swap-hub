"use client";

import { Suspense } from "react";
import AccountSuspended from "@/components/auth/AccountSuspended";
import { RefreshCw } from "lucide-react";

function AccountSuspendedFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Loading account status...</p>
      </div>
    </div>
  );
}

export default function AccountSuspendedPage() {
  return (
    <Suspense fallback={<AccountSuspendedFallback />}>
      <AccountSuspended />
    </Suspense>
  );
}
