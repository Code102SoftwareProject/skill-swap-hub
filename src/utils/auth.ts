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
    const response = await fetch("/api/admin/signout", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Logout failed: ${response.status}`);
    }

    // Redirect to login page after successful logout
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
  } catch (error) {
    console.error("Logout error:", error);
    // Show user-friendly error message
    if (typeof window !== "undefined") {
      alert(
        "An error occurred during logout. Please try again or close your browser."
      );
    }
  }
}
