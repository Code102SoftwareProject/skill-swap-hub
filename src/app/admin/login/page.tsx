import { redirect } from "next/navigation";
import { getServerAdminAuth } from "@/lib/auth/serverAdminAuth";
import AdminLoginForm from "@/components/Admin/AdminLoginForm";
export const dynamic = 'force-dynamic';

/**
 * Admin Login Page
 * Server component that checks for existing authentication and redirects if already logged in
 * Otherwise renders the client-side login form
 */
export default async function AdminLoginPage() {
  // Check if admin is already authenticated on the server
  const { isAuthenticated, admin } = await getServerAdminAuth();

  // Redirect to dashboard if already authenticated
  if (isAuthenticated && admin) {
    console.log(
      `Admin ${admin.username} already authenticated, redirecting to dashboard`
    );
    redirect("/admin/dashboard");
  }

  // Render the login form if not authenticated
  return <AdminLoginForm />;
}
