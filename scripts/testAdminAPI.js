import dotenv from "dotenv";
dotenv.config();

// Test admin verify API
const testAdminVerifyAPI = async () => {
  try {
    console.log("🔍 Testing admin verify API...\n");

    // First login to get the token
    const loginResponse = await fetch("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "superadmin",
        password: "SuperAdmin123!",
      }),
    });

    if (!loginResponse.ok) {
      console.error("❌ Login failed:", await loginResponse.text());
      return;
    }

    // Get the cookie from the response
    const setCookieHeader = loginResponse.headers.get("set-cookie");
    console.log("✅ Login successful");

    // Now verify the admin data
    const verifyResponse = await fetch(
      "http://localhost:3000/api/admin/verify-auth",
      {
        method: "GET",
        headers: {
          Cookie: setCookieHeader || "",
        },
      }
    );

    if (!verifyResponse.ok) {
      console.error("❌ Verify failed:", await verifyResponse.text());
      return;
    }

    const verifyData = await verifyResponse.json();
    console.log("✅ Admin verification successful");
    console.log("📋 Admin data returned:");
    console.log("- Username:", verifyData.admin?.username);
    console.log("- Role:", verifyData.admin?.role);
    console.log("- Permissions:", verifyData.admin?.permissions);
    console.log("- Status:", verifyData.admin?.status);
    console.log("");

    // Check specific permissions
    const permissions = verifyData.admin?.permissions || [];
    console.log("🔐 Permission checks:");
    console.log(
      "- Can manage admins:",
      permissions.includes("manage_admins") ? "✅ YES" : "❌ NO"
    );
    console.log(
      "- Can manage users:",
      permissions.includes("manage_users") ? "✅ YES" : "❌ NO"
    );
    console.log(
      "- Can view dashboard:",
      permissions.includes("view_dashboard") ? "✅ YES" : "❌ NO"
    );
  } catch (error) {
    console.error("❌ Error testing API:", error);
  }
};

testAdminVerifyAPI();
