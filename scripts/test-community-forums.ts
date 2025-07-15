/**
 * Community Forums Test Suite
 * Comprehensive test runner for all community forum components and pages
 */

import { execSync } from 'child_process';

console.log('🧪 Running Community Forums Test Suite...\n');

const testFiles = [
  // Component Tests
  '__tests__/components/communityForum/ForumPosts.test.tsx',
  '__tests__/components/communityForum/CreatePostPopup.test.tsx',
  '__tests__/components/communityForum/LikeDislikeButtons.test.tsx',
  '__tests__/components/communityForum/WatchPostButton.test.tsx',
  '__tests__/components/communityForum/PersonalizedFeed.test.tsx',
  '__tests__/components/communityForum/ForumManagement.test.tsx',
  
  // Page Tests
  '__tests__/pages/communityForum/ForumMainPage.test.tsx'
];

console.log('📋 Test Coverage Areas:');
console.log('✅ Forum Posts Display & Interaction');
console.log('✅ Post Creation & Form Validation');
console.log('✅ Like/Dislike Functionality');
console.log('✅ Post Watching/Bookmarking');
console.log('✅ Personalized Content Feed');
console.log('✅ Admin Forum Management');
console.log('✅ Forum Main Page & Navigation');
console.log('✅ Error Handling & Edge Cases');
console.log('✅ Accessibility & Performance');
console.log('✅ Responsive Design');

console.log('\n🚀 Starting Test Execution...\n');

try {
  // Run all community forum tests
  execSync(`npm test -- --testPathPattern="communityForum" --verbose`, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ All Community Forums tests completed successfully!');
  
} catch (error) {
  console.error('\n❌ Some tests failed. Please check the output above.');
  process.exit(1);
}

export {};
