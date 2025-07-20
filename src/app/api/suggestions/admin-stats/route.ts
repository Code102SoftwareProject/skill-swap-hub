import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Suggestion from '@/lib/models/Suggestion';
import User from '@/lib/models/userSchema';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connect();

    // Get all users first
    const allUsers = await User.find({}).select('firstName lastName email avatar isBlocked');
    console.log(`Found ${allUsers.length} total users in database`);

    // Get suggestion stats for users who have suggestions
    const stats = await Suggestion.aggregate([
      // Only include suggestions with valid ObjectId userId
      { $match: { $expr: { $eq: [ { $type: '$userId' }, 'objectId' ] } } },
      {
        $group: {
          _id: '$userId',
          totalSuggestions: { $sum: 1 },
          suggestions: {
            $push: {
              date: '$date',
            },
          },
        },
      },
    ]);

    console.log(`Found ${stats.length} users with suggestions`);

    // Create a map of user stats for quick lookup
    const statsMap = new Map();
    stats.forEach(stat => {
      statsMap.set(stat._id.toString(), stat);
    });

    // Process all users
    const results = await Promise.all(
      allUsers.map(async (user) => {
        const userStat = statsMap.get(user._id.toString());
        
        let totalSuggestions = 0;
        let maxInDay = 0;
        
        if (userStat) {
          totalSuggestions = userStat.totalSuggestions;
          
          // Sort suggestion dates
          const dates = userStat.suggestions.map((s: { date: Date }) => new Date(s.date)).sort((a: Date, b: Date) => a.getTime() - b.getTime());
          let left = 0;
          for (let right = 0; right < dates.length; right++) {
            while (dates[right].getTime() - dates[left].getTime() > 24 * 60 * 60 * 1000) { // 24 hours in milliseconds
              left++;
            }
            maxInDay = Math.max(maxInDay, right - left + 1);
          }
        }

        // Check if user has hidden suggestions
        const hiddenSuggestionsCount = await Suggestion.countDocuments({
          userId: user._id,
          isHidden: true
        });

        // Debug logging
        //console.log(`User ${user.firstName} ${user.lastName}: isBlocked = ${user.isBlocked}, hasHiddenSuggestions = ${hiddenSuggestionsCount > 0}, totalSuggestions = ${totalSuggestions}, maxInDay = ${maxInDay}`);

        return {
          userId: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          avatarUrl: user.avatar,
          totalSuggestions: totalSuggestions,
          maxSuggestionsIn1Day: maxInDay,
          status: maxInDay > 5 ? 'Suspicious' : 'Normal', // Increased threshold for daily limit
          isBlocked: user.isBlocked || false,
          hasHiddenSuggestions: hiddenSuggestionsCount > 0,
        };
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch admin suggestion stats', details: (error as Error).message },
      { status: 500 }
    );
  }
} 