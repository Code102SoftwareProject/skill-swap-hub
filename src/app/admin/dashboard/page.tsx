"use client"; // Required for client-side rendering

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import AdminNavbar from "@/components/Admin/AdminNavbar";

import DashboardContent from "@/components/Admin/dashboardContent/DashboardContent";
import KYCContent from "@/components/Admin/dashboardContent/KYCContent";
import UsersContent from "@/components/Admin/dashboardContent/UsersContent";
import SuspendedUsersContent from "@/components/Admin/dashboardContent/SuspendedUsersContent";
import SuggestionsContent from "@/components/Admin/dashboardContent/SuggestionsContent";
import SystemContent from "@/components/Admin/dashboardContent/SystemContent";
import VerificationRequests from "@/components/Admin/skillverifications";
import ReportingContent from "@/components/Admin/dashboardContent/ReportingContent";
import ForumReportsContent from "@/components/Admin/dashboardContent/ForumReportsContent";
import SuccessStoriesContent from "@/components/Admin/dashboardContent/SuccessStoriesContent";

// Import AdminManagementContent directly to avoid chunk loading issues
import AdminManagementContent from "../../../components/Admin/dashboardContent/AdminManagementContent";

// Constants to avoid magic strings
const COMPONENTS = {
  DASHBOARD: "dashboard",
  ADMIN_MANAGEMENT: "admin-management",
  KYC: "kyc",
  USERS: "users",
  SUSPENDED_USERS: "suspended-users",
  SUCCESS_STORIES: "success-stories",
  SUGGESTIONS: "suggestions",
  SYSTEM: "system",
  VERIFY_DOCUMENTS: "verify-documents",
  REPORTING: "reporting",
  FORUM_REPORTS: "forum-reports",
};

// Define interface for Admin data
interface Admin {
  userId: string;
  username: string;
  role: string;
  permissions: string[];
}

// Define interface for AdminData with extended properties
interface AdminData {
  userId: string;
  username: string;
  role: string;
  permissions: string[];
  email?: string;
  status?: string;
  createdAt?: string;
  createdBy?: string;
}

// Toast notification type definition
interface ToastMessage {
  id: number;
  type: "error" | "success" | "warning" | "info";
  message: string;
}

// Error Fallback Component
interface ErrorFallbackProps {
  error: Error | { message?: string; stack?: string } | unknown;
  componentName: string;
}

const ErrorFallback = ({ error, componentName }: ErrorFallbackProps) => {
  return (
    <div className="p-6 bg-red-50 border border-red-100 rounded-lg">
      <h2 className="text-red-700 text-xl font-semibold mb-2">
        Something went wrong loading {componentName}
      </h2>
      <p className="text-red-600 mb-4">
        {(error as any)?.message || "An unexpected error occurred"}
      </p>
      <div className="bg-white p-4 rounded-md overflow-auto max-h-40">
        <pre className="text-sm text-gray-700">{(error as any)?.stack}</pre>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
      >
        Reload Page
      </button>
    </div>
  );
};

// Toast notification component
const Toast = ({
  toast,
  onClose,
}: {
  toast: ToastMessage;
  onClose: (id: number) => void;
}) => {
  const bgColor = {
    error: "bg-red-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  }[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div
      className={`${bgColor} text-white p-4 rounded-md shadow-lg flex justify-between items-center mb-3`}
    >
      <p>{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="ml-4 text-white hover:text-gray-200"
      >
        ×
      </button>
    </div>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<Admin | null>(null);
  const [activeComponent, setActiveComponent] = useState(COMPONENTS.DASHBOARD);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Add toast notification
  const addToast = (
    type: "error" | "success" | "warning" | "info",
    message: string
  ) => {
    const newToast = {
      id: Date.now(),
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  // Remove toast notification
  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    const verifyAdminAuth = async () => {
      try {
        // Use the same verification endpoint as AdminProtected component
        const response = await fetch("/api/admin/verify-auth", {
          method: "GET",
          credentials: "include", // Important for cookies
        });

        const data = await response.json();

        if (!response.ok || !data.authenticated) {
          console.log("Authentication failed, redirecting to login");
          setAuthError(
            "Your session has expired or you do not have admin privileges."
          );
          setTimeout(() => {
            router.replace("/admin/login");
          }, 3000);
          return;
        }

        // Authentication is valid, store admin data
        if (data.admin) {
          setAdminData(data.admin);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Authentication error:", error);
        setAuthError(
          "Failed to verify your admin credentials. Please try logging in again."
        );
        addToast(
          "error",
          "Authentication failed. Redirecting to login page..."
        );
        setTimeout(() => {
          router.replace("/admin/login");
        }, 3000);
      }
    };

    verifyAdminAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      addToast("info", "Logging out...");

      // Call signout API to invalidate token and clear cookie
      const response = await fetch("/api/admin/signout", {
        method: "POST",
        credentials: "include", // Important for cookies
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      addToast("success", "Logout successful. Redirecting...");
      // Force redirect to login page
      setTimeout(() => {
        router.replace("/admin/login");
      }, 1500);
    } catch (error) {
      console.error("Logout error:", error);
      addToast("error", "Logout failed. Please try again.");
    }
  };

  // If authentication error, show error message
  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-semibold mt-2">Authentication Error</h2>
          </div>
          <p className="text-gray-700 text-center mb-6">{authError}</p>
          <p className="text-gray-500 text-center text-sm">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  // If still loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg flex items-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading dashboard...
        </div>
      </div>
    );
  }

  // Function to return the right component based on selected tab with error handling
  const renderContent = () => {
    try {
      switch (activeComponent) {
        case COMPONENTS.DASHBOARD:
          return <DashboardContent key={activeComponent} />;
        case COMPONENTS.ADMIN_MANAGEMENT:
          return (
            <AdminManagementContent
              key={activeComponent}
              currentAdminRole={adminData?.role}
            />
          );
        case COMPONENTS.KYC:
          return <KYCContent key={activeComponent} />;
        case COMPONENTS.USERS:
          return <UsersContent key={activeComponent} />;
        case COMPONENTS.SUSPENDED_USERS:
          return <SuspendedUsersContent key={activeComponent} />;
        case COMPONENTS.SUCCESS_STORIES:
          return <SuccessStoriesContent key={activeComponent} />;
        case COMPONENTS.SUGGESTIONS:
          return <SuggestionsContent key={activeComponent} />;
        case COMPONENTS.SYSTEM:
          return <SystemContent key={activeComponent} />;
        case COMPONENTS.VERIFY_DOCUMENTS:
          return <VerificationRequests key={activeComponent} />;
        case COMPONENTS.REPORTING:
          return <ReportingContent key={activeComponent} />;
        case COMPONENTS.FORUM_REPORTS:
          return <ForumReportsContent key={activeComponent} />;
        default:
          return <DashboardContent key={activeComponent} />;
      }
    } catch (error) {
      console.error(`Error rendering ${activeComponent} component:`, error);
      addToast("error", `Failed to load ${activeComponent} component`);
      return <ErrorFallback error={error} componentName={activeComponent} />;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Toast notification container - fixed position in the top right corner */}
      <div className="fixed top-4 right-4 z-50 w-80">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>

      {/* Left sidebar with navigation options */}
      <AdminSidebar
        onNavigate={setActiveComponent}
        activeComponent={activeComponent}
        adminData={adminData}
      />

      {/* Main content area - takes remaining space with flex layout */}
      <div className="flex flex-col flex-1 ">
        {/* Top navigation bar */}
        <AdminNavbar adminData={adminData} />

        {/* Main content container with scrollable area and styling */}
        <main className="p-6 mt-4 overflow-y-auto bg-gray-50 min-h-screen">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
