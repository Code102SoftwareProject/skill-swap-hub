// File: src/app/api/skills/categories/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillList from '@/lib/models/skillList';

export async function GET(request: Request) {
  try {
    // Extract category ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const id = pathParts[pathParts.length - 1];
    
    console.log(`Received request for category ID: ${id}`);
    
    const categoryId = parseInt(id);
    
    if (isNaN(categoryId)) {
      console.log(`Invalid category ID: ${id}`);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid category ID' 
      }, { status: 400 });
    }
    
    await dbConnect();
    console.log(`Connected to DB, searching for category ID: ${categoryId}`);
    
    // Try to find the category by ID
    const category = await SkillList.findOne({ categoryId });
    
    console.log(`Search result:`, category ? `Found category: ${category.categoryName}` : 'Category not found');
    
    if (!category) {
      return NextResponse.json({ 
        success: false, 
        message: 'Category not found' 
      }, { status: 404 });
    }
    
    console.log(`Returning ${category.skills?.length || 0} skills for category ${category.categoryName}`);
    
    return NextResponse.json({ 
      success: true, 
      data: category.skills 
    });
  } catch (error) {
    console.error('Error fetching skills for category:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch skills for category' 
    }, { status: 500 });
  }
}