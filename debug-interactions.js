// Debug script to test user interactions API
console.log('🔧 Testing User Interactions API');

// Test function
async function testUserInteractionsAPI() {
  try {
    // First, let's check if we have a token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ No auth token found. Please log in first.');
      return;
    }

    console.log('✅ Auth token found');

    // Test interaction tracking
    const testPayload = {
      postId: '507f1f77bcf86cd799439011', // Sample MongoDB ObjectId
      forumId: '507f1f77bcf86cd799439012', // Sample MongoDB ObjectId  
      interactionType: 'view',
      timeSpent: 30,
      deviceType: 'desktop',
      isComplete: true
    };

    console.log('📤 Testing interaction tracking with payload:', testPayload);

    const response = await fetch('/api/user/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📡 Response status:', response.status);
    
    const responseData = await response.json();
    console.log('📡 Response data:', responseData);

    if (response.ok) {
      console.log('✅ Interaction tracking API test passed!');
      
      // Now test getting analytics
      console.log('📤 Testing analytics retrieval...');
      const analyticsResponse = await fetch('/api/user/interactions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const analyticsData = await analyticsResponse.json();
      console.log('📊 Analytics data:', analyticsData);
      
      if (analyticsResponse.ok) {
        console.log('✅ Analytics API test passed!');
      } else {
        console.log('❌ Analytics API test failed');
      }
      
    } else {
      console.log('❌ Interaction tracking API test failed');
      console.log('Error details:', responseData);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Auto-run if we're in the browser
if (typeof window !== 'undefined') {
  window.testUserInteractionsAPI = testUserInteractionsAPI;
  console.log('📋 To run the test, open browser dev tools and call: testUserInteractionsAPI()');
}

export { testUserInteractionsAPI };
