// Test component to verify infinite re-render fix
import React, { useEffect, useRef } from 'react';
import { useUserPreferences } from '../src/hooks/useUserPreferences';

const InfiniteRenderTest = () => {
  const renderCount = useRef(0);
  const { trackInteraction, getPersonalizedFeed, fetchPreferences } = useUserPreferences();

  // Track render count
  renderCount.current += 1;

  useEffect(() => {
    console.log(`🔄 Component rendered ${renderCount.current} times`);
    
    // If render count exceeds 5, we likely have an infinite render issue
    if (renderCount.current > 5) {
      console.error('❌ Infinite render detected! Component has rendered more than 5 times.');
    } else if (renderCount.current <= 3) {
      console.log('✅ Normal render count detected.');
    }
  });

  useEffect(() => {
    console.log('📡 useEffect with dependencies triggered');
    // This should only run when dependencies change, not on every render
  }, [trackInteraction, getPersonalizedFeed, fetchPreferences]);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Infinite Render Test Component</h3>
      <p>Render count: {renderCount.current}</p>
      <p>Check console for render tracking logs</p>
      <small>
        This component tests if the useUserPreferences hook functions are properly memoized
        and don't cause infinite re-renders.
      </small>
    </div>
  );
};

// Instructions for testing
const TestInstructions = () => (
  <div style={{ padding: '20px', backgroundColor: '#f5f5f5', margin: '10px' }}>
    <h2>🧪 Infinite Render Test</h2>
    <h3>How to test:</h3>
    <ol>
      <li>Import and render the InfiniteRenderTest component in your app</li>
      <li>Open browser dev tools and check the console</li>
      <li>If you see "Normal render count detected" - the issue is fixed ✅</li>
      <li>If you see "Infinite render detected" - there's still an issue ❌</li>
    </ol>
    
    <h3>Expected behavior:</h3>
    <ul>
      <li>Component should render 1-3 times initially (normal React behavior)</li>
      <li>After initial renders, it should NOT continue re-rendering</li>
      <li>The useEffect with dependencies should only trigger once after mount</li>
    </ul>

    <InfiniteRenderTest />
  </div>
);

export { InfiniteRenderTest, TestInstructions };
export default TestInstructions;
