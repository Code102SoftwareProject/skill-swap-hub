"use client"
import { Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart } from "recharts";
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

interface SkillCount {
  [key: string]: number;
}

// Custom color palette based on your design
const COLORS = {
  primary: '#026aa1',       // Dark blue
  secondary: '#1d7fbf',     // Medium blue
  tertiary: '#3399d6',      // Light blue
  accent1: '#66b3e6',       // Very light blue
  accent2: '#99ccee',       // Lightest blue
  accent3: '#cce6f7'        // Pale blue
};

export function SkillsRequested() {
  const [data, setData] = useState<SkillCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token || !user?._id) {
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/listings?type=mine`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        
        const result = await response.json();
        
        if (result.success && result.data) {
          const skillCounts: SkillCount = {};
          
          result.data.forEach((listing: any) => {
            const skillName = listing.seeking.skillTitle;
            skillCounts[skillName] = (skillCounts[skillName] || 0) + 1;
          });
          
          setData([skillCounts]);
        } else {
          throw new Error(result.message || 'Failed to fetch data');
        }
      } catch (error) {
        console.error('Error fetching skills data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user?._id]);

  if (loading) return <div className="text-center py-10">Loading your requested skills...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!data.length || !Object.keys(data[0]).length) return <div className="text-center py-10">You haven't requested any skills yet</div>;

  const skillNames = Object.keys(data[0]);

  return (
    <ResponsiveContainer width="100%" minHeight={300}>
      <BarChart data={data} width={500} height={250}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="name"
          tick={{ fill: '#555' }}
          axisLine={{ stroke: '#ddd' }}
        />
        <YAxis 
          tick={{ fill: '#555' }}
          axisLine={{ stroke: '#ddd' }}
        />
        <Tooltip 
          contentStyle={{
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
        <Legend 
          wrapperStyle={{
            paddingTop: '20px'
          }}
        />
        {skillNames.map((skill, index) => (
          <Bar 
            key={skill} 
            dataKey={skill} 
            fill={Object.values(COLORS)[index % Object.keys(COLORS).length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SkillsOffered() {
  const [data, setData] = useState<SkillCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token || !user?._id) {
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/listings?type=mine`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        
        const result = await response.json();
        
        if (result.success && result.data) {
          const skillCounts: SkillCount = {};
          
          result.data.forEach((listing: any) => {
            const skillName = listing.offering.skillTitle;
            skillCounts[skillName] = (skillCounts[skillName] || 0) + 1;
          });
          
          setData([skillCounts]);
        } else {
          throw new Error(result.message || 'Failed to fetch data');
        }
      } catch (error) {
        console.error('Error fetching skills data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user?._id]);

  if (loading) return <div className="text-center py-10">Loading your offered skills...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!data.length || !Object.keys(data[0]).length) return <div className="text-center py-10">You haven't offered any skills yet</div>;

  const skillNames = Object.keys(data[0]);

  return (
    <ResponsiveContainer width="100%" minHeight={300}>
      <BarChart data={data} width={500} height={250}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="name"
          tick={{ fill: '#555' }}
          axisLine={{ stroke: '#ddd' }}
        />
        <YAxis 
          tick={{ fill: '#555' }}
          axisLine={{ stroke: '#ddd' }}
        />
        <Tooltip 
          contentStyle={{
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
        <Legend 
          wrapperStyle={{
            paddingTop: '20px'
          }}
        />
        {skillNames.map((skill, index) => (
          <Bar 
            key={skill} 
            dataKey={skill} 
            fill={Object.values(COLORS)[index % Object.keys(COLORS).length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CardWithBar() {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden p-4 max-w-md mx-auto mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Skills Requested</h2>
      <div className="border-t border-gray-200 mt-4 pt-4">
        <SkillsRequested />
      </div>
    </div>
  );
}