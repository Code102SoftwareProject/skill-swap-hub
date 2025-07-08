// Test admin success stories API with authentication
const testAdminSuccessStoriesWithAuth = async () => {
  try {
    console.log("🔍 Testing admin success stories API with authentication...\n");

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

    // Now test the success stories API
    const successStoriesResponse = await fetch(
      "http://localhost:3000/api/admin/success-stories?page=1&limit=10&search=&status=all",
      {
        method: "GET",
        headers: {
          Cookie: setCookieHeader || "",
        },
      }
    );

    console.log("Response status:", successStoriesResponse.status);

    const successStoriesData = await successStoriesResponse.json();
    console.log("Response data:", JSON.stringify(successStoriesData, null, 2));

    if (successStoriesResponse.ok && successStoriesData.success) {
      console.log("✅ Admin success stories API working correctly");
      console.log(`📊 Found ${successStoriesData.data.successStories.length} success stories`);
      console.log(`📄 Total pages: ${successStoriesData.data.pagination.totalPages}`);
    } else {
      console.error("❌ Admin success stories API failed");
    }

  } catch (error) {
    console.error("❌ Error testing admin API:", error.message);
  }
};

// Wait a bit for the server to be ready
setTimeout(testAdminSuccessStoriesWithAuth, 1000);
