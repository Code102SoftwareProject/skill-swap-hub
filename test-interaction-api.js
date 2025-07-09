// Simple test script for the interactions API
const testInteractionAPI = async () => {
  try {
    // Get JWT token from localStorage (you'll need to manually set this)
    const token = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token
    
    const response = await fetch('http://localhost:3000/api/user/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        postId: '507f1f77bcf86cd799439011', // Sample ObjectId
        forumId: '507f1f77bcf86cd799439012', // Sample ObjectId
        interactionType: 'view',
        timeSpent: 30,
        deviceType: 'desktop',
        isComplete: true
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Interaction tracking test passed');
    } else {
      console.log('❌ Interaction tracking test failed');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('To test the interaction API, open browser dev tools and run:');
  console.log('1. Log in to get a token');
  console.log('2. Replace YOUR_JWT_TOKEN_HERE with your actual token');
  console.log('3. Call testInteractionAPI()');
  window.testInteractionAPI = testInteractionAPI;
} else {
  console.log('This script should be run in a browser environment after login');
}
