import connect from '@/lib/db';
import User from "@/lib/models/userSchema";
import Session from "@/lib/models/sessionSchema";
import SkillList from "@/lib/models/skillList";
import SkillListing from "@/lib/models/skillListing";
import SkillMatch from "@/lib/models/skillMatch";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connect(); // Connect to your MongoDB

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true }); // Adjust query based on your schema

    const sessions = await Session.countDocuments();
    const skillsRequested = await SkillList.countDocuments();
    const skillsOffered = await SkillListing.countDocuments();
    const matches = await SkillMatch.countDocuments();

    const popularSkillDoc = await SkillList.aggregate([
      { $group: { _id: "$skillName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    const popularSkill = popularSkillDoc.length > 0 ? popularSkillDoc[0]._id : "N/A";

    const skillsData = await SkillList.aggregate([
      { $group: { _id: "$skillName", requests: { $sum: 1 } } }
    ]);

    const skillsOfferedData = await SkillListing.aggregate([
      { $group: { _id: "$skillName", offers: { $sum: 1 } } }
    ]);

    const skillMap: { [key: string]: { skill: string; requests: number; offers: number } } = {};

    skillsData.forEach(skill => {
      skillMap[skill._id] = { skill: skill._id, requests: skill.requests, offers: 0 };
    });

    skillsOfferedData.forEach(skill => {
      if (skillMap[skill._id]) {
        skillMap[skill._id].offers = skill.offers;
      } else {
        skillMap[skill._id] = { skill: skill._id, requests: 0, offers: skill.offers };
      }
    });

    return NextResponse.json({
      activeUsers,
      totalUsers,
      sessions,
      popularSkill,
      skillsOffered,
      skillsRequested,
      matches,
      skillsData: Object.values(skillMap)
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
