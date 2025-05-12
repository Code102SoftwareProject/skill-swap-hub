

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
