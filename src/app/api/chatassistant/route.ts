import { NextRequest, NextResponse } from 'next/server';
import { getAnswerFromGemini } from '@/lib/chatassistant/gemini';

/**
 * Agent function to handle skill verification request status
 * @param userId - The user ID to check verification status for
 */
async function checkVerificationStatus(userId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/verification-request?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch verification status: ${response.status}`);
    }

    const responseData = await response.json();
    
    // The API now returns an array of requests under the data property
    const verificationRequests = responseData.data;
    
    return {
      type: 'verification_status',
      data: verificationRequests,
      message: formatVerificationResponse(verificationRequests)
    };
  } catch (error: any) {
    console.error("Error checking verification status:", error);
    return {
      type: 'error',
      message: `I couldn't retrieve your verification request status. Error: ${error.message}`
    };
  }
}

/**
 * Formats verification status data into a readable message
 */
function formatVerificationResponse(requests: any[]) {
  if (!requests || requests.length === 0) {
    return "You don't have any verification requests at the moment.";
  }

  // Sort requests by date (newest first) - they should already be sorted from the API
  // but we'll ensure it here
  const sortedRequests = [...requests].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Get the most recent request
  const latestRequest = sortedRequests[0];
  const { status, createdAt, skillName } = latestRequest;
  const date = new Date(createdAt).toLocaleDateString();

  let statusMessage = '';
  switch (status) {
    case 'pending':
      statusMessage = `Your verification request for ${skillName} submitted on ${date} is still pending review. We'll notify you once it's processed.`;
      break;
    case 'approved':
      statusMessage = `Great news! Your verification request for ${skillName} submitted on ${date} has been approved.`;
      break;
    case 'rejected':
      statusMessage = `Your verification request for ${skillName} submitted on ${date} was not approved. You can submit a new request with additional documentation.`;
      break;
    default:
      statusMessage = `Your verification request for ${skillName} submitted on ${date} has status: ${status}.`;
  }

  // If there are multiple requests, add a summary
  if (requests.length > 1) {
    const pendingCount = requests.filter(req => req.status === 'pending').length;
    const approvedCount = requests.filter(req => req.status === 'approved').length;
    const rejectedCount = requests.filter(req => req.status === 'rejected').length;
    
    statusMessage += `\n\nYou have a total of ${requests.length} verification requests:`;
    if (pendingCount > 0) statusMessage += `\n- ${pendingCount} pending`;
    if (approvedCount > 0) statusMessage += `\n- ${approvedCount} approved`;
    if (rejectedCount > 0) statusMessage += `\n- ${rejectedCount} rejected`;
  }

  return statusMessage;
}

/**
 * Determines intent from user question
 */
function determineIntent(question: string) {
  const lowerQuestion = question.toLowerCase();
  
  // Check for verification status intent
  if (
    lowerQuestion.includes('verification') ||
    lowerQuestion.includes('skill request') ||
    lowerQuestion.includes('skill verification') ||
    lowerQuestion.includes('request status') ||
    (lowerQuestion.includes('status') && lowerQuestion.includes('request'))
  ) {
    return 'check_verification_status';
  }
  
  // Default to technical knowledge questions
  return 'technical_question';
}

/**
 * Handles technical questions using Gemini's knowledge
 */
async function handleTechnicalQuestion(question: string) {
  try {
    // No need for external search, directly ask Gemini
    const answer = await getAnswerFromGemini(question);
    
    return {
      type: 'text_response',
      message: answer
    };
  } catch (error: any) {
    console.error("Error getting answer from Gemini:", error);
    return {
      type: 'error',
      message: "I encountered an error while processing your question. Please try asking in a different way."
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { question, userId } = await req.json();
    
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Determine the intent of the user's question
    const intent = determineIntent(question);
    
    let response;
    
    // Handle different intents
    switch (intent) {
      case 'check_verification_status':
        // If userId is missing when needed for verification status
        if (!userId) {
          return NextResponse.json({ 
            error: 'User ID is required to check verification status' 
          }, { status: 400 });
        }
        response = await checkVerificationStatus(userId);
        break;
        
      case 'technical_question':
      default:
        response = await handleTechnicalQuestion(question);
        break;
    }
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error("Error processing question:", error);
    return NextResponse.json({ 
      error: `Failed to process your question: ${error.message}` 
    }, { status: 500 });
  }
}