// Import AdminProtected component to restrict access to admin users only
import AdminProtected from "@/components/AdminProtected";

/**
 * Layout component for the admin dashboard
 * Wraps all dashboard content with authentication protection
 * Only authenticated admin users can access children components
 */
export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminProtected>{children}</AdminProtected>;
}
