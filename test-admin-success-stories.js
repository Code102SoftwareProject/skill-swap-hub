// Test script to check admin success stories API
async function testAdminSuccessStoriesAPI() {
  try {
    console.log('Testing admin success stories API...');
    
    // First, let's test without authentication to see the error
    const response = await fetch('http://localhost:3000/api/admin/success-stories');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ API correctly requires authentication');
    } else if (response.status === 500) {
      console.error('❌ API returning 500 error - schema issue likely');
    } else {
      console.log('✅ API working correctly');
    }
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Wait a bit for the server to be ready
setTimeout(testAdminSuccessStoriesAPI, 1000);
