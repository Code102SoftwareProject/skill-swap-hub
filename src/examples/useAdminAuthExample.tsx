/**
 * Example usage of the useAdminAuth hook
 *
 * This hook provides a clean separation of concerns by:
 * 1. Extracting authentication logic into a reusable custom hook
 * 2. Using AbortController to properly cancel fetch requests on unmount
 * 3. Providing comprehensive error handling with toast notifications
 * 4. Offering loading and error states for better UX
 */

import { useAdminAuth } from "@/lib/hooks/useAdminAuth";

function ExampleAdminComponent() {
  const { isAuthenticated, isLoading, error } = useAdminAuth();

  // Handle loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Handle error state (component will show error UI and redirect)
  if (error) {
    return <div>Authentication error occurred</div>;
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  // Render authenticated content
  return <div>Welcome, authenticated admin!</div>;
}

export default ExampleAdminComponent;
