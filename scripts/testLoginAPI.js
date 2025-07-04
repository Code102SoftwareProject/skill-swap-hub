import fetch from "node-fetch";

// Test login API directly
const testLogin = async () => {
  try {
    console.log("🔍 Testing admin login API...");

    const response = await fetch("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "superadmin",
        password: "SuperAdmin123!",
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers));

    const data = await response.json();
    console.log("Response data:", data);

    if (response.ok) {
      console.log("✅ Login API test successful!");
    } else {
      console.log("❌ Login API test failed!");
    }
  } catch (error) {
    console.error("❌ Error testing login API:", error);
  }
};

// Run the test
testLogin();
