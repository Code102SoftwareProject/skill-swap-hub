import { NextRequest, NextResponse } from 'next/server';
import { getAnswerFromGemini } from '@/lib/chatassistant/gemini';
import connect from '@/lib/db';
import VerificationRequestModel from '@/lib/models/VerificationRequest';

/**
 * Agent function to handle skill verification request status
 * @param userId - The user ID to check verification status for
 */

async function checkVerificationStatus(userId: string) {
  try {

    await connect();
    
    // Query database directly instead of making an HTTP call
    const verificationRequests = await VerificationRequestModel.find({ userId })
      .sort({ createdAt: -1 });
    
    // If no requests found, return early with a message
    if (!verificationRequests || verificationRequests.length === 0) {
      return {
        type: 'verification_status',
        data: [],
        message: "You don't have any verification requests at the moment."
      };
    }
    
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


function formatVerificationResponse(requests: any[]) {
  if (!requests || requests.length === 0) {
    return "You don't have any verification requests at the moment.";
  }

 
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

  // Check for SkillSwap platform questions
  if (
    lowerQuestion.includes('skillswap') ||
    lowerQuestion.includes('platform') ||
    lowerQuestion.includes('forum') ||
    lowerQuestion.includes('session') ||
    lowerQuestion.includes('meeting') ||
    lowerQuestion.includes('badge') ||
    lowerQuestion.includes('profile') ||
    lowerQuestion.includes('how to') ||
    lowerQuestion.includes('navigate') ||
    lowerQuestion.includes('feature')
  ) {
    return 'platform_question';
  }

  // Check for unrelated/personal questions
  const unrelatedKeywords = [
    'weather', 'news', 'sports', 'politics', 'personal', 'relationship',
    'cooking', 'recipe', 'movie', 'music', 'entertainment', 'travel',
    'health', 'medical', 'financial advice', 'investment', 'shopping'
  ];
  
  if (unrelatedKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return 'unrelated_question';
  }
  
  // Default to technical questions
  return 'technical_question';
}

/**
 * Handles technical questions using Gemini's knowledge
 */
async function handleTechnicalQuestion(question: string) {
  try {
    // Check message length
    if (question.length > 200) {
      return {
        type: 'text_response',
        message: "Please keep your message shorter (under 200 characters) for better assistance. Try breaking down your question into smaller parts."
      };
    }

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

/**
 * Handles SkillSwap platform-related questions
 */
async function handlePlatformQuestion(question: string) {
  try {
    if (question.length > 200) {
      return {
        type: 'text_response',
        message: "Please keep your message shorter for better assistance. What specific SkillSwap feature do you need help with?"
      };
    }

    const platformContext = `This question is about the SkillSwap platform features, navigation, or usage.`;
    const answer = await getAnswerFromGemini(question, platformContext);
    
    return {
      type: 'text_response',
      message: answer
    };
  } catch (error: any) {
    console.error("Error handling platform question:", error);
    return {
      type: 'error',
      message: "I couldn't process your SkillSwap question right now. Please try again."
    };
  }
}

/**
 * Handles unrelated questions with appropriate boundaries
 */
function handleUnrelatedQuestion() {
  return {
    type: 'text_response',
    message: "I'm the SkillSwap Chat Assistant and I can only help with platform-related questions, skill verification, or technical programming topics. Please ask about SkillSwap features, forums, sessions, or coding concepts."
  };
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

      case 'platform_question':
        response = await handlePlatformQuestion(question);
        break;

      case 'unrelated_question':
        response = handleUnrelatedQuestion();
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