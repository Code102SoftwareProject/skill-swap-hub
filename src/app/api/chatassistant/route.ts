import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import Post from '@/lib/models/postSchema';
import { getAnswerFromGemini } from '@/lib/chatassistant/gemini';

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Connect to database using the Mongoose connection function
    await connect();
    
    // Fetch relevant posts based on the question using Mongoose model
    const posts = await Post.find({
      $or: [
        { title: { $regex: question, $options: 'i' } },
        { content: { $regex: question, $options: 'i' } }
      ]
    })
    .limit(10)
    .lean();
    
    if (posts.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find any posts related to your question. Please try a different question."
      });
    }
    
    // Prepare context from posts for Gemini
    const context = posts.map(post => 
      `Title: ${post.title}\nContent: ${post.content}\n\n`
    ).join('');
    
    // Get answer from Gemini API
    const answer = await getAnswerFromGemini(question, context);
    
    return NextResponse.json({ answer, relatedPosts: posts });
  } catch (error: any) {
    console.error("Error processing question:", error);
    return NextResponse.json({ 
      error: `Failed to process your question: ${error.message}` 
    }, { status: 500 });
  }
}