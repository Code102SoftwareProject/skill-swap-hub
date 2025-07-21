"use client";
import { FC } from "react";
import { useRouter } from "next/navigation";
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
  UserX,
  NotebookTabs,
  MessageSquare,
} from "lucide-react";
import clsx from "clsx";

// ... (keep all your existing interfaces and navItems array)
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
    id: "suspended-users",
    label: "Suspended Users",
    icon: UserX,
    permission: "manage_users",
  },
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
    id: "inbox",
    label: "Inbox",
    icon: MessageSquare,
    // permission: "manage_inbox", // Removed to make always visible
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
  {
    id: "forum-reports",
    label: "Forum Reports",
    icon: NotebookTabs,
    permission: "manage_forum_reports",
  },
];

const AdminSidebar: FC<AdminSidebarProps> = ({
  onNavigate,
  activeComponent,
  adminData,
}) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/admin/signout", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) router.push("/admin/login");
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  return (
    <aside className="w-56 fixed top-0 left-0 h-screen bg-white flex flex-col justify-between border-r border-gray-200 pt-28 overflow-y-auto">
      <div className="flex flex-col w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeComponent === item.id;
          const hasPermission =
            !item.permission ||
            !adminData ||
            (adminData.permissions && adminData.permissions.includes(item.permission));

          if (!hasPermission && item.permission) return null;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={clsx(
                "flex items-center w-full px-4 py-3 border-l-4 transition-all duration-200",
                isActive
                  ? "bg-primary text-white border-blue-600"
                  : "text-gray-500 hover:bg-gray-100 border-transparent"
              )}
            >
              <Icon className={clsx("w-5 h-5 mr-3", isActive ? "text-white" : "text-gray-400")} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

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