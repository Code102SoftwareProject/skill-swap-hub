"use client"; // Required for using client-side hooks (e.g., useState, useRouter)

// Importing React & Next modules
import { FC } from "react";
import { useRouter } from "next/navigation"; // Next.js router for navigation

//Importing Lucide icons
import {
  Home,
  IdCard,
  Users,
  Lightbulb,
  Settings,
  FileText,
  Flag,
  LogOut,
  Shield,
  Star,
} from "lucide-react";

import clsx from "clsx"; // Utility for conditional class names

// Define props for conditional rendering
interface AdminSidebarProps {
  onNavigate: (component: string) => void; // Function passed from parent to switch the view
  activeComponent: string; // Current active component ID
  adminData?: {
    userId: string;
    username: string;
    role: string;
    permissions: string[];
  } | null; // Admin data for permission checking
}

// Navigation items config
const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    permission: "view_dashboard",
  },
  {
    id: "admin-management",
    label: "Admin Management",
    icon: Shield,
    permission: "manage_admins",
  },
  { id: "kyc", label: "KYC", icon: IdCard, permission: "manage_kyc" },
  { id: "users", label: "Users", icon: Users, permission: "manage_users" },
  {
    id: "success-stories",
    label: "Success Stories",
    icon: Star,
    permission: "manage_success_stories",
  },
  {
    id: "suggestions",
    label: "Suggestions",
    icon: Lightbulb,
    permission: "manage_suggestions",
  },
  {
    id: "system",
    label: "System",
    icon: Settings,
    permission: "manage_system",
  },
  {
    id: "verify-documents",
    label: "Verify Documents",
    icon: FileText,
    permission: "manage_verification",
  },
  {
    id: "reporting",
    label: "Reporting",
    icon: Flag,
    permission: "manage_reporting",
  },
];

// Component
const AdminSidebar: FC<AdminSidebarProps> = ({
  onNavigate,
  activeComponent,
  adminData,
}) => {
  const router = useRouter(); // Now we'll use this for navigation

  // Sign out logic - updated to call the API and redirect
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/admin/signout", {
        method: "POST",
        credentials: "include", // Important to include cookies in the request
      });

      if (response.ok) {
        // Redirect to login page after successful signout
        router.push("/admin/login");
      } else {
        console.error("Failed to sign out");
      }
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  return (
    <aside className="w-56 h-screen bg-white flex flex-col justify-between border-r border-gray-200 pt-28">
      {/* Navigation Section (conditionally rendered) */}
      <div className="flex flex-col w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeComponent === item.id;

          // Check if admin has permission to access this item
          const hasPermission =
            !adminData ||
            !item.permission ||
            (adminData.permissions &&
              adminData.permissions.includes(item.permission));

          // Don't render the item if user doesn't have permission
          if (!hasPermission) {
            return null;
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)} //  Trigger component switch
              className={clsx(
                "flex items-center w-full px-4 py-3 border-l-4 transition-all duration-200",
                isActive
                  ? "bg-primary text-white border-blue-600"
                  : "text-gray-500 hover:bg-gray-100 border-transparent"
              )}
            >
              <Icon
                className={clsx(
                  "w-5 h-5 mr-3",
                  isActive ? "text-white" : "text-gray-400"
                )}
              />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Logout Button (conditionally rendered) */}
      <div className="mt-auto border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-gray-100"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
