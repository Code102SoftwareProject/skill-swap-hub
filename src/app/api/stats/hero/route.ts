import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/userSchema';
import SkillList from '@/lib/models/skillList';
import SkillMatch from '@/lib/models/skillMatch';
import { Feedback } from '@/lib/models/feedbackSchema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();

    // Active learners
    const activeLearners = await User.countDocuments({ isDeleted: { $ne: true }, isBlocked: { $ne: true } });

    // Skills available (unique skill names across all categories)
    const skillLists = await SkillList.find({}).select('skills');
    const skillSet = new Set();
    skillLists.forEach(list => {
      list.skills.forEach(skill => {
        skillSet.add(skill.name);
      });
    });
    const skillsAvailable = skillSet.size;

    // Successful matches and total matches
    const successfulMatches = await SkillMatch.countDocuments({ status: 'completed' });
    const totalMatches = await SkillMatch.countDocuments({});

    // Satisfaction rate (average rating)
    const feedbacks = await Feedback.find({ rating: { $exists: true } }).select('rating');
    let satisfactionRate = 0;
    if (feedbacks.length > 0) {
      const avg = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length;
      satisfactionRate = Math.round(avg * 20); // Convert 1-5 to %
    }

    return NextResponse.json({
      success: true,
      data: {
        activeLearners,
        skillsAvailable,
        successfulMatches,
        totalMatches,
        satisfactionRate
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch hero stats' }, { status: 500 });
  }
}
