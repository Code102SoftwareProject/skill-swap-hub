import { SearchService } from '@/app/services/SearchService';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    console.log('Search query:', query);

    if (!query) {
      return NextResponse.json({ forums: [] });
    }

    const searchService = SearchService.getInstance();
    await searchService.initialize();
    
    const forums = await searchService.searchForums(query);
    console.log('Search results:', forums);

    return NextResponse.json({ 
      forums,
      error: null 
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        forums: [], 
        error: 'Failed to perform search' 
      },
      { status: 500 }
    );
  }
}