// Test script to verify database models and connections
import dbConnect from '../src/lib/db.js';
import UserPreference from '../src/lib/models/UserPreference.js';
import PostView from '../src/lib/models/PostView.js';

async function testDatabaseConnection() {
  try {
    console.log('🔌 Testing database connection...');
    
    await dbConnect();
    console.log('✅ Database connected successfully');
    
    // Test UserPreference model
    console.log('🧪 Testing UserPreference model...');
    const testUserId = '507f1f77bcf86cd799439013';
    
    const testPreference = {
      userId: testUserId,
      forumInterests: ['507f1f77bcf86cd799439014'],
      watchedPosts: [],
      likedCategories: ['technology'],
      preferences: {
        emailNotifications: true,
        pushNotifications: false,
        digestFrequency: 'weekly'
      },
      interactionHistory: []
    };
    
    // Try to create a test preference
    const created = await UserPreference.create(testPreference);
    console.log('✅ UserPreference model working - created:', created._id);
    
    // Clean up test data
    await UserPreference.deleteOne({ _id: created._id });
    console.log('🧹 Test data cleaned up');
    
    // Test PostView model
    console.log('🧪 Testing PostView model...');
    const testPostView = {
      postId: '507f1f77bcf86cd799439015',
      userId: testUserId,
      forumId: '507f1f77bcf86cd799439016',
      viewedAt: new Date(),
      timeSpent: 45,
      deviceType: 'desktop',
      isComplete: true
    };
    
    const createdView = await PostView.create(testPostView);
    console.log('✅ PostView model working - created:', createdView._id);
    
    // Clean up test data
    await PostView.deleteOne({ _id: createdView._id });
    console.log('🧹 Test data cleaned up');
    
    console.log('🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabaseConnection();
}

export { testDatabaseConnection };
