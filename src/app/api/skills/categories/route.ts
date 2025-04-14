// File: src/app/api/skills/categories/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillList from '@/lib/models/skillList';

// GET - Fetch all skill categories
export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Fetch all skill categories
    const categories = await SkillList.find({}).select('categoryId categoryName');
   
    console.log('Categories count:', categories.length);
    
    return NextResponse.json({ 
      success: true, 
      data: categories 
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch categories' 
    }, { status: 500 });
  }
}
