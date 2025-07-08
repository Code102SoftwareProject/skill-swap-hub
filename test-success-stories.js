// Test script to check success stories API

async function testSuccessStoriesAPI() {
  try {
    console.log('Testing success stories API...');
    const response = await fetch('http://localhost:3000/api/success-stories?limit=6');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.status === 500) {
      console.error('❌ API still returning 500 error');
    } else {
      console.log('✅ API working correctly');
    }
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Wait a bit for the server to be ready
setTimeout(testSuccessStoriesAPI, 2000);
