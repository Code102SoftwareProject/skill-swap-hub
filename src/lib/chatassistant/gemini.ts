
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * @param question The user's question
 * @param context Optional additional context to provide to Gemini
 * @returns The generated answer
 */

export async function getAnswerFromGemini(question: string, context?: string): Promise<string> {
  try {
    // Get the generative model 
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Construct the prompt with SkillSwap context
    let prompt = `You are the SkillSwap Chat Assistant, a helpful AI assistant for the SkillSwap platform.

ABOUT SKILLSWAP PLATFORM:
SkillSwap is a comprehensive skill-sharing and professional development platform that offers:
- Skill verification and certification system
- Community forums for discussions and knowledge sharing
- User-to-user sessions for skill exchange and learning
- Meeting system for virtual collaboration
- Badge and achievement system
- User profiles and networking
- Admin moderation and reporting system
- Notification system for platform updates

RESPONSE GUIDELINES:
1. Keep answers concise and to the point (max 2-3 sentences)
2. Only answer questions related to:
   - SkillSwap platform features and usage
   - Technical programming concepts
   - Skill verification process
   - Platform navigation and help
3. For unrelated questions, respond: "I'm the SkillSwap Chat Assistant and I can only help with platform-related questions or technical topics. Please ask about SkillSwap features, skill verification, or programming concepts."
4. If user asks for detailed explanations, suggest: "For detailed information, please keep your message shorter or contact our support team."
5. Always maintain a helpful but professional tone.

User Question: ${question}`;

    // Add context if provided
    if (context) {
      prompt += `\n\nAdditional context:\n${context}`;
    }

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Ensure response length is reasonable
    if (text.length > 300) {
      return text.substring(0, 297) + "...";
    }

    return text;
  } catch (error) {
    console.error('Error getting answer from Gemini:', error);
    return 'I encountered an error while processing your question. Please try again later.';
  }
}