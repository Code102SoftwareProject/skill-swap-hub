import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import axios from "axios";

interface ChartData {
  label: string;
  duration: number;
}

interface TimeSpentChartProps {
  userId: string;
}

const rangeOptions = ["day", "week", "month"] as const;

type Range = typeof rangeOptions[number];

export const TimeSpentChart: React.FC<TimeSpentChartProps> = ({ userId }) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [range, setRange] = useState<Range>("day");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    axios
      .get(`/api/sessionTimer/summary?userId=${userId}&range=${range}`)
      .then((res) => {
        const summary = res.data.summary;
        const formatted = summary.map((item: any) => {
          let label = "";
          if (range === "day") {
            label = `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(item._id.day).padStart(2, "0")}`;
          } else if (range === "week") {
            label = `Week ${item._id.week}, ${item._id.year}`;
          } else if (range === "month") {
            label = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
          }
          return { label, duration: Math.round(item.totalDuration / 60) }; // minutes
        });
        setData(formatted);
      })
      .finally(() => setLoading(false));
  }, [userId, range]);

  return (
    <div className="w-full bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold"></h2>
        <select
          className="border rounded px-2 py-1"
          value={range}
          onChange={(e) => setRange(e.target.value as Range)}
        >
          {rangeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={(value) => `${value} min`} />
            <Bar dataKey="duration" fill="#026aa1" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
  
 