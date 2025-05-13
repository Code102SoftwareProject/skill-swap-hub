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

// Mock data for Skills Offered
const offeredData =[
    {"Coding & Programming" : 8,
      "Creative Arts & Entertainment" :12,
      "Home Improvement & DIY" : 9,
      "Education & Tutoring" : 14,
      "Culinary & Food Services" : 5,
      "Lifestyle & Personal Services" : 7
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
        <Bar dataKey="Coding & Programming"  fill="#026aa1"/>
        <Bar dataKey="Creative Arts & Entertainment"  fill="#1d7fbf"/>
        <Bar dataKey="Home Improvement & DIY"  fill="#3399d6"/>
        <Bar dataKey="Education & Tutoring"  fill="#66b3e6"/>
        <Bar dataKey="Culinary & Food Services"  fill="#99ccee"/>
        <Bar dataKey="Lifestyle & Personal ServicesCoding & Programming"  fill="#cce6f7"/>
    </BarChart>
        </ResponsiveContainer>
    )
}

export function SkillsOffered() {
    return (
        <ResponsiveContainer width = "100%" minHeight={300} >
        <BarChart data={offeredData} width={500} height={250}>
        <CartesianGrid stroke="hsl(var(--muted))"/>
        <XAxis />
        <YAxis />
        <Tooltip/>
        <Legend />
        <Bar dataKey="Coding & Programming"  fill="#026aa1"/>
        <Bar dataKey="Creative Arts & Entertainment"  fill="#1d7fbf"/>
        <Bar dataKey="Home Improvement & DIY"  fill="#3399d6"/>
        <Bar dataKey="Education & Tutoring"  fill="#66b3e6"/>
        <Bar dataKey="Culinary & Food Services"  fill="#99ccee"/>
        <Bar dataKey="Lifestyle & Personal Services"  fill="#cce6f7"/>
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
  
 