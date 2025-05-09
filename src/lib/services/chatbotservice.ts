

interface ResponseData {
  type: string;
  message: string;
  data?: any;
}

/**
 * Sends a message to the chatbot API and formats the response
 * @param message - User's message to send to the chatbot
 * @param userId - Optional user ID to include in the request
 * @returns Properly formatted response for display
 */
export async function sendMessage(
  message: string, 
  userId?: string
): Promise<string | { text: string; type?: string }> {
  try {
    const response = await fetch('/api/chatassistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        question: message,
        userId: userId // Use passed userId instead of directly accessing context
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response');
    }

    const data: ResponseData = await response.json();
    
    // Handle different response types
    switch (data.type) {
      case 'verification_status':
        return {
          text: data.message,
          type: 'verification_status'
        };
        
      case 'text_response':
        return data.message;
        
      case 'error':
        throw new Error(data.message);
        
      default:
        // For backward compatibility or unknown response types
        return data.message || 'I received your message but couldn\'t process it correctly.';
    }
  } catch (error: any) {
    console.error('Error in chat service:', error);
    throw error;
  }
}

/**
 * Retrieves user verification status directly
 * Can be used for direct status checks outside the chat flow
 * @param userId - The user ID to check verification status for
 */
export async function checkVerificationStatus(userId: string): Promise<{ status: string; details?: any }> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const response = await fetch(`/api/users/verification-request?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch verification status: ${response.status}`);
    }

    const data = await response.json();
    return {
      status: data.request?.status || 'none',
      details: data.request
    };
  } catch (error) {
    console.error('Error checking verification status:', error);
    throw error;
  }
}