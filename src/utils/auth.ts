import { cookies } from "next/headers";

/**
 * Handles admin logout by clearing authentication state
 * - Removes localStorage tokens
 * - Expires authentication cookies
 * - Redirects to login page
 */
export async function logoutAdmin() {
  // Clear localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("admin_token");
  }

  // Clear cookies via API call
  try {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Logout error:", error);
  }
}
