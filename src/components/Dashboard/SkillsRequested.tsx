"use client"
import { Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer , Legend, BarChart } from "recharts";

const data =[
    {"Coding & Programming" : 10,
      "Creative Arts & Entertainment" :15,
      "Home Improvement & DIY" : 6,
      "Education & Tutoring" : 11,
      "Culinary & Food Services" : 3,
      "Lifestyle & Personal Services" : 4
    }
]

export function SkillsRequested() {
    return (
        <ResponsiveContainer width = "100%" minHeight={300} >
        <BarChart data={data} width={500} height={250}>
        <CartesianGrid stroke="hsl(var(--muted))"/>
        <XAxis />
        <YAxis />
        <Tooltip/>
        <Legend />
        <Bar dataKey="Coding & Programming"  fill="#BBEEFF"/>
        <Bar dataKey="Creative Arts & Entertainment"  fill="#95C8FF"/>
        <Bar dataKey="Home Improvement & DIY"  fill="#70A3FF"/>
        <Bar dataKey="Education & Tutoring"  fill="#4A7DFF"/>
        <Bar dataKey="Culinary & Food Services"  fill="#2457F6"/>
        <Bar dataKey="Lifestyle & Personal ServicesCoding & Programming"  fill="#0031D0"/>
    </BarChart>
        </ResponsiveContainer>
    )
}

export function CardWithBar() {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden p-4 max-w-md mx-auto my-20">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Skills Requested </h2>
        <div className="border-t border-gray-200 mt-4 pt-4">
          <SkillsRequested />
        </div>
      </div>
    );
  };
  
 