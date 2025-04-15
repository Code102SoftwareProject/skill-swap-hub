import { NextResponse } from "next/server";
import connect from '@/lib/db';
import User from "@/lib/models/userSchema";

export async function GET() {
  try {
    await connect();

    const users = await User.find({});

    const activeUsers = users.filter((u) => u.isActive).length;
    const totalSessions = users.reduce((sum, u) => sum + (u.sessions || 0), 0);

    const skills = users.flatMap((u) => u.skillsOffered || []);
    const skillCounts: Record<string, number> = {};
    skills.forEach((skill) => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });

    const popularSkill = Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    const totalSkillsOffered = new Set(users.flatMap(u => u.skillsOffered || [])).size;
    const totalSkillsRequested = new Set(users.flatMap(u => u.skillsRequested || [])).size;

    return NextResponse.json({
      activeUsers,
      totalSessions,
      popularSkill,
      totalSkillsOffered,
      totalSkillsRequested,
      matches: 10, // dummy value, replace with actual match count logic if needed
    });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
