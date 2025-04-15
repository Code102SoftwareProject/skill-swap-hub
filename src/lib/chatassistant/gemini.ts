import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Please add your Gemini API key to .env.local');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function getAnswerFromGemini(question: string, context: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  
  const prompt = `
    Based on the following context, please answer the question:
    
    Question: ${question}
    
    Context:
    ${context}
    
    Provide an accurate and helpful answer based solely on the information in the context. If the answer cannot be found in the context, state that you don't have enough information to answer the question.
  `;
  
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Sorry, I encountered an error processing your question. Please try again.";
  }
}
