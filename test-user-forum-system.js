// Comprehensive test for the User Forum Watch and Personalized Feed System
console.log('🚀 User Forum System - Comprehensive Test Suite');

// Test configuration
const TEST_CONFIG = {
  // You can update these with real IDs from your database for testing
  samplePostId: '507f1f77bcf86cd799439011',
  sampleForumId: '507f1f77bcf86cd799439012',
  testUserId: '507f1f77bcf86cd799439013'
};

class UserForumTester {
  constructor() {
    this.token = null;
    this.testResults = [];
  }

  log(message, type = 'info') {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${emoji[type]} [${timestamp}] ${message}`);
    
    this.testResults.push({
      timestamp,
      message,
      type
    });
  }

  async init() {
    this.log('Initializing User Forum System Tests');
    
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      this.log('Must be run in browser environment', 'error');
      return false;
    }

    // Get auth token
    this.token = localStorage.getItem('auth_token');
    if (!this.token) {
      this.log('No auth token found. Please log in first.', 'error');
      return false;
    }

    this.log('Auth token found', 'success');
    return true;
  }

  async testUserPreferences() {
    this.log('Testing User Preferences API...');
    
    try {
      // Test GET preferences
      const getResponse = await fetch('/api/user/preferences', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      
      if (getResponse.ok) {
        const data = await getResponse.json();
        this.log('✓ GET preferences successful', 'success');
        
        // Test POST preferences update
        const updatePayload = {
          preferences: {
            emailNotifications: true,
            pushNotifications: false,
            digestFrequency: 'weekly'
          },
          forumInterests: [TEST_CONFIG.sampleForumId],
          likedCategories: ['technology', 'programming']
        };
        
        const postResponse = await fetch('/api/user/preferences', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatePayload)
        });
        
        if (postResponse.ok) {
          this.log('✓ POST preferences update successful', 'success');
          return true;
        } else {
          this.log('✗ POST preferences update failed', 'error');
        }
      } else {
        this.log('✗ GET preferences failed', 'error');
      }
    } catch (error) {
      this.log(`Preferences test error: ${error.message}`, 'error');
    }
    
    return false;
  }

  async testWatchPosts() {
    this.log('Testing Watch Posts API...');
    
    try {
      // Test watching a post
      const watchResponse = await fetch('/api/user/watch-posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId: TEST_CONFIG.samplePostId,
          action: 'watch'
        })
      });
      
      if (watchResponse.ok) {
        this.log('✓ Watch post successful', 'success');
        
        // Test getting watched posts
        const getWatchedResponse = await fetch('/api/user/watch-posts', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        
        if (getWatchedResponse.ok) {
          this.log('✓ Get watched posts successful', 'success');
          
          // Test unwatching
          const unwatchResponse = await fetch('/api/user/watch-posts', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              postId: TEST_CONFIG.samplePostId,
              action: 'unwatch'
            })
          });
          
          if (unwatchResponse.ok) {
            this.log('✓ Unwatch post successful', 'success');
            return true;
          }
        }
      }
    } catch (error) {
      this.log(`Watch posts test error: ${error.message}`, 'error');
    }
    
    return false;
  }

  async testInteractions() {
    this.log('Testing Interactions API...');
    
    try {
      const interactionPayload = {
        postId: TEST_CONFIG.samplePostId,
        forumId: TEST_CONFIG.sampleForumId,
        interactionType: 'view',
        timeSpent: 30,
        deviceType: 'desktop',
        isComplete: true
      };
      
      const response = await fetch('/api/user/interactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(interactionPayload)
      });
      
      if (response.ok) {
        this.log('✓ Track interaction successful', 'success');
        
        // Test getting analytics
        const analyticsResponse = await fetch('/api/user/interactions', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        
        if (analyticsResponse.ok) {
          this.log('✓ Get interaction analytics successful', 'success');
          return true;
        }
      } else {
        const errorData = await response.json();
        this.log(`✗ Track interaction failed: ${errorData.message}`, 'error');
      }
    } catch (error) {
      this.log(`Interactions test error: ${error.message}`, 'error');
    }
    
    return false;
  }

  async testPersonalizedFeed() {
    this.log('Testing Personalized Feed API...');
    
    try {
      const response = await fetch('/api/user/feed?page=1&limit=5', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.log('✓ Personalized feed retrieval successful', 'success');
        this.log(`Feed contains ${data.data.posts.length} posts`, 'info');
        return true;
      } else {
        this.log('✗ Personalized feed retrieval failed', 'error');
      }
    } catch (error) {
      this.log(`Personalized feed test error: ${error.message}`, 'error');
    }
    
    return false;
  }

  async runAllTests() {
    this.log('🏁 Starting comprehensive test suite...');
    
    const initialized = await this.init();
    if (!initialized) {
      this.log('Initialization failed. Aborting tests.', 'error');
      return;
    }

    const tests = [
      { name: 'User Preferences', fn: () => this.testUserPreferences() },
      { name: 'Watch Posts', fn: () => this.testWatchPosts() },
      { name: 'Interactions', fn: () => this.testInteractions() },
      { name: 'Personalized Feed', fn: () => this.testPersonalizedFeed() }
    ];

    let passed = 0;
    let total = tests.length;

    for (const test of tests) {
      this.log(`Running ${test.name} test...`);
      const result = await test.fn();
      if (result) {
        passed++;
        this.log(`${test.name} test PASSED`, 'success');
      } else {
        this.log(`${test.name} test FAILED`, 'error');
      }
    }

    this.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      this.log('🎉 All tests passed! User Forum System is working correctly.', 'success');
    } else {
      this.log(`⚠️ ${total - passed} test(s) failed. Please check the errors above.`, 'warning');
    }

    return { passed, total, results: this.testResults };
  }

  // Utility method to test with real data
  async testWithRealData(postId, forumId) {
    TEST_CONFIG.samplePostId = postId;
    TEST_CONFIG.sampleForumId = forumId;
    this.log(`Updated test config with real IDs: postId=${postId}, forumId=${forumId}`);
    return this.runAllTests();
  }
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.UserForumTester = UserForumTester;
  window.testUserForumSystem = async () => {
    const tester = new UserForumTester();
    return await tester.runAllTests();
  };
  
  window.testWithRealData = async (postId, forumId) => {
    const tester = new UserForumTester();
    return await tester.testWithRealData(postId, forumId);
  };
  
  console.log('📋 Available test functions:');
  console.log('  - testUserForumSystem() - Run all tests with sample data');
  console.log('  - testWithRealData(postId, forumId) - Run tests with real post/forum IDs');
}

export { UserForumTester };
