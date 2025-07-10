// File: src/app/api/skills/trending/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillMatch from '@/lib/models/skillMatch';

// GET - Fetch trending skills based on match frequency
export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Aggregate to count skill usage in matches
    const trendingSkills = await SkillMatch.aggregate([
      // Only include active matches (not rejected)
      {
        $match: {
          status: { $in: ['pending', 'accepted', 'completed'] }
        }
      },
      // Create documents for each skill mentioned in matches
      {
        $project: {
          skills: [
            '$userOneDetails.offeringSkill',
            '$userOneDetails.seekingSkill',
            '$userTwoDetails.offeringSkill',
            '$userTwoDetails.seekingSkill'
          ]
        }
      },
      // Unwind the skills array
      { $unwind: '$skills' },
      // Group by skill and count occurrences
      {
        $group: {
          _id: '$skills',
          matchCount: { $sum: 1 },
          skillName: { $first: '$skills' }
        }
      },
      // Sort by match count (most popular first)
      { $sort: { matchCount: -1 } },
      // Limit results
      { $limit: limit },
      // Clean up the output
      {
        $project: {
          _id: 0,
          skillName: '$_id',
          matchCount: 1,
          trendScore: {
            $multiply: ['$matchCount', 100] // Simple trend score calculation
          }
        }
      }
    ]);
    
    // Also get total matches for percentage calculation
    const totalMatches = await SkillMatch.countDocuments({
      status: { $in: ['pending', 'accepted', 'completed'] }
    });
    
    // Add percentage to each skill
    const trendingSkillsWithPercentage = trendingSkills.map(skill => ({
      ...skill,
      percentage: totalMatches > 0 ? ((skill.matchCount / totalMatches) * 100).toFixed(1) : '0.0'
    }));
    
    return NextResponse.json({ 
      success: true, 
      data: trendingSkillsWithPercentage,
      totalMatches,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching trending skills:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch trending skills' 
    }, { status: 500 });
  }
}