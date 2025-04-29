'use client'; // Indicates this is a client component in Next.js

import { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2'; // Chart components for data visualization
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register the required chart components with ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// Define the structure of dashboard data we expect from the API
interface DashboardData {
  totalUsers: number;        
  sessions: number;          
  popularSkill: string;      // Most requested/popular skill
  skillsOffered: number;     
  skillsRequested: number;   
  matches: number;           
  skillsData: { skill: string; requests: number; offers: number }[]; // Detailed skill statistics
  userRegistrationData: { _id: { year: number; month: number }; count: number }[]; // User registration data
}

export default function DashboardContent() {
  // State to hold dashboard data, initially null until fetched
  const [data, setData] = useState<DashboardData | null>(null);

  // Effect hook to fetch dashboard data when component mounts
  useEffect(() => {
    async function fetchData() {
      try {
        // Call the admin dashboard API endpoint
        const res = await fetch('/api/admin/dashboard');
        
        // Parse JSON response
        const json = await res.json();
        
        // Update state with fetched data
        setData(json);
      } catch (err) {
        // Handle and log any errors during fetch
        console.error('Failed to fetch dashboard data', err);
      }
    }
    
    // Execute the fetch function
    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  // Show loading indicator while data is being fetched
  if (!data) return <div className="p-8">Loading...</div>;

  // Extract skill names for chart labels
  const skillLabels = data.skillsData.map(skill => skill.skill);

  // Format user registration data for chart
  const formatUserData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels: string[] = [];
    const counts: number[] = [];
    
    if (data.userRegistrationData && data.userRegistrationData.length > 0) {
      data.userRegistrationData.forEach(item => {
        const monthName = months[item._id.month - 1];
        labels.push(`${monthName} ${item._id.year}`);
        counts.push(item.count);
      });
    }
    
    return { labels, counts };
  };
  
  const userData = formatUserData();

  return (
    <div className="p-8 grid gap-8">
      {/* Top Stats Section - Key metrics displayed as cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total Users" value={data.totalUsers.toString()} />
        <StatCard title="No of Sessions" value={data.sessions.toString()} />
        <StatCard title="Popular Skill" value={data.popularSkill} />
        <StatCard title="No of Skills Offered" value={data.skillsOffered.toString()} />
        <StatCard title="No of Skills Requested" value={data.skillsRequested.toString()} />
      </div>

      {/* Line Chart - Showing user registration data over time */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">User Registration Over Time</h2>
        <Line
          data={{
            labels: userData.labels,
            datasets: [{
              label: 'Number of Users',
              data: userData.counts,
              backgroundColor: 'rgba(59, 130, 246, 0.5)', // Light blue fill
              borderColor: 'rgba(59, 130, 246, 1)',       // Blue border
            }]
          }}
          options={{ responsive: true }} // Make chart responsive to container size
        />
      </div>

      {/* Bar Charts Section - Side by side comparison of skills requested vs offered */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Skills Requested Chart */}
        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Skills Requested</h2>
          <Bar
            data={{
              labels: skillLabels,
              datasets: [{
                label: 'No of Requests',
                data: data.skillsData.map(skill => skill.requests), // Extract request counts
                backgroundColor: 'rgba(34, 197, 94, 0.5)',          // Light green
              }]
            }}
            options={{ responsive: true }}
          />
        </div>

        {/* Skills Offered Chart */}
        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Skills Offered</h2>
          <Bar
            data={{
              labels: skillLabels,
              datasets: [{
                label: 'No of Offers',
                data: data.skillsData.map(skill => skill.offers), // Extract offer counts
                backgroundColor: 'rgba(96, 165, 250, 0.5)',       // Light blue
              }]
            }}
            options={{ responsive: true }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * StatCard - Reusable component for displaying individual metric cards
 * @param {string} title - The title of the statistic
 * @param {string} value - The value to display
 */
function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-blue-100 rounded-xl p-4 flex flex-col justify-center items-center shadow-sm">
      <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-blue-800">{value}</p>
    </div>
  );
}

