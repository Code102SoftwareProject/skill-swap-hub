"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Call logout API to clear server-side session/cookies
      const res = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        // Force a refresh of all client data and redirect to login
        router.refresh();
        router.replace("/admin/login");
      }
    } catch (error) {
      console.error("Logout failed", error);
      // Fallback - still redirect to login
      router.replace("/admin/login");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
    >
      Logout
    </button>
  );
}
