import { cookies } from "next/headers";

// localStorage key constants
const ADMIN_AUTHENTICATED_KEY = "adminAuthenticated";
const ADMIN_TOKEN_KEY = "admin_token";

/**
 * Handles admin logout by clearing authentication state
 * - Removes localStorage tokens
 * - Expires authentication cookies
 * - Redirects to login page
 */
export async function logoutAdmin() {
  // Clear localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem(ADMIN_AUTHENTICATED_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
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
