
export async function sendMessage(message: string): Promise<string> {
    try {
      const response = await fetch('/api/chatassistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: message }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }
  
      const data = await response.json();
      return data.answer;
    } catch (error) {
      console.error('Error in chat service:', error);
      throw error;
    }
  }