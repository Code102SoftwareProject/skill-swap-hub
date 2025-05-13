"use client"
import { LineChart , Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer , Legend } from "recharts";

const data =[
    {hour: 2, date: "2024-12-22"},
    {hour:10, date: "2024-12-21"},
    {hour: 16, date: "2024-12-20"},
    {hour: 19, date: "2024-12-19"},
    {hour: 5, date: "2024-12-18"},
    {hour: 12, date: "2024-12-17"},
    {hour: 9, date: "2024-12-16"}
]

export function TimeSpent() {
    return (
        <ResponsiveContainer width = "100%" minHeight={300} >
            <LineChart data={data} width={500} height={250}>
        <CartesianGrid stroke="hsl(var(--muted))"/>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip/>
        <Legend />
        <Line dot={false} dataKey="hour" type="monotone" name="Time Spent" stroke="#026aa1" fill="#99ccee"/>
    </LineChart>
        </ResponsiveContainer>
    )
}

export function CardWithChart() {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Time Spent </h2>
        <div className="border-t border-gray-200 mt-4 pt-4">
          <TimeSpent />
        </div>
      </div>
    );
  };
  
 