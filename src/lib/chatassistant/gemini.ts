
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Construct the prompt
    let prompt = `You are a helpful technical assistant that provides accurate and concise information.

Question: ${question}`;

    // Add context if provided
    if (context) {
      prompt += `\n\nAdditional context:\n${context}`;
    }

    // Add system instruction for formatting
    prompt += `\n\nProvide a clear and direct answer. If you don't know the answer with certainty, acknowledge the limitations.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error getting answer from Gemini:', error);
    return 'I encountered an error while processing your question. Please try again later.';
  }
}