"use client"; // Indicates this is a client component in Next.js

import { useEffect, useState } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2"; // Added Doughnut
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement, // Added for Doughnut chart
} from "chart.js";

// Register the required chart components with ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement // Register ArcElement for Doughnut chart
);

// Constants for repeated values
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Chart labels and static strings
const CHART_LABELS = {
  numberOfUsers: "Number of Users",
  userRegistration: "User Registration Over Time",
  skillsRequested: "Skills Requested",
  skillsOffered: "Skills Offered",
  noOfRequests: "No of Requests",
  noOfOffers: "No of Offers",
  skillDistribution: "Skill Distribution by Category", // Add this line
  statTitles: {
    totalUsers: "Total Users",
    noOfSessions: "No of Sessions",
    newUsersThisWeek: "New Users This Week", // Replace popularSkill with newUsersThisWeek
    skillMatchRate: "Skill Match Rate",
    noOfSkillsRequested: "No of Skills Requested",
  },
  timeRanges: {
    today: "Today",
    week: "1 Week",
    month: "1 Month",
    year: "Entire Year",
  },
};

// Add category colors for the doughnut chart
const COLORS = {
  blue: {
    fill: "rgba(59, 130, 246, 0.5)",
    border: "rgba(59, 130, 246, 1)",
  },
  green: {
    fill: "rgba(34, 197, 94, 0.5)",
    border: "rgba(34, 197, 94, 1)",
  },
  lightBlue: {
    fill: "rgba(96, 165, 250, 0.5)",
    border: "rgba(96, 165, 250, 1)",
  },
  // Tailwind blue palette with high contrast
  categoryColors: [
    "rgba(30, 58, 138, 0.9)", // blue-900
    "rgba(37, 99, 235, 0.9)", // blue-700
    "rgba(59, 130, 246, 0.9)", // blue-500
    "rgba(96, 165, 250, 0.9)", // blue-400
    "rgba(147, 197, 253, 0.9)", // blue-300
    "rgba(3, 105, 161, 0.9)", // sky-800
    "rgba(14, 165, 233, 0.9)", // sky-500
    "rgba(56, 189, 248, 0.9)", // sky-400
    "rgba(8, 145, 178, 0.9)", // cyan-700
    "rgba(6, 182, 212, 0.9)", // cyan-500
    "rgba(34, 211, 238, 0.9)", // cyan-400
  ],
  categoryBorders: [
    "rgba(30, 58, 138, 1)", // blue-900
    "rgba(37, 99, 235, 1)", // blue-700
    "rgba(59, 130, 246, 1)", // blue-500
    "rgba(96, 165, 250, 1)", // blue-400
    "rgba(147, 197, 253, 1)", // blue-300
    "rgba(3, 105, 161, 1)", // sky-800
    "rgba(14, 165, 233, 1)", // sky-500
    "rgba(56, 189, 248, 1)", // sky-400
    "rgba(8, 145, 178, 1)", // cyan-700
    "rgba(6, 182, 212, 1)", // cyan-500
    "rgba(34, 211, 238, 1)", // cyan-400
  ],
};

// Time range options for filtering
type TimeRange = "today" | "week" | "month" | "year";

// API endpoint for dashboard data
const DASHBOARD_API_URL = "/api/admin/dashboard";

// Define the structure of dashboard data we expect from the API
interface DashboardData {
  totalUsers: number;
  sessions: number;
  newUsersThisWeek: number; // Replace popularSkill with newUsersThisWeek
  skillsOffered: number;
  skillsRequested: number;
  matches: number;
  skillsData: { skill: string; requests: number; offers: number }[]; // Detailed skill statistics
  userRegistrationData: {
    _id: { year: number; month: number; day?: number }; // Added day for more detailed filtering
    count: number;
    date?: Date; // Add date field for filtering
  }[]; // User registration data
}

// Define interface for skill list data
interface SkillListData {
  _id: string;
  categoryId: number;
  categoryName: string;
  skills: string[];
}

/**
 * Simple fuzzy matching function to compare two strings
 * Returns true if strA contains strB or vice versa (case-insensitive)
 * or if they share enough common words
 *
 * @param {string} strA - First string to compare
 * @param {string} strB - Second string to compare
 * @returns {boolean} Whether the strings are considered similar
 */
const isSimilarSkill = (strA: string, strB: string): boolean => {
  if (!strA || !strB) return false;

  // Normalize both strings
  const normA = strA.trim().toLowerCase();
  const normB = strB.trim().toLowerCase();

  // Direct substring check
  if (normA.includes(normB) || normB.includes(normA)) {
    return true;
  }

  // Split into words and check for common words
  const wordsA = normA.split(/\s+/);
  const wordsB = normB.split(/\s+/);

  // If both have multiple words, check for at least 2 common words
  if (wordsA.length > 1 && wordsB.length > 1) {
    const commonWords = wordsA.filter(
      (word) => word.length > 3 && wordsB.includes(word)
    );
    if (commonWords.length >= 1) return true;
  }

  return false;
};

/**
 * Skeleton loader component for stat cards
 *
 * @returns {JSX.Element} A placeholder UI element with animation for stat cards during loading
 */
function SkeletonStatCard() {
  return (
    <div className="bg-gray-100 rounded-xl p-4 flex flex-col justify-center items-center shadow-sm animate-pulse">
      <div className="h-4 w-20 bg-gray-300 mb-2 rounded"></div>
      <div className="h-8 w-10 bg-gray-300 rounded"></div>
    </div>
  );
}

/**
 * Skeleton loader component for charts
 *
 * @returns {JSX.Element} A placeholder UI element with animation for charts during loading
 */
function SkeletonChart() {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 animate-pulse">
      <div className="h-6 w-48 bg-gray-300 mb-8 rounded"></div>
      <div className="h-64 w-full bg-gray-200 rounded"></div>
    </div>
  );
}

/**
 * Main dashboard content component for the admin panel
 *
 * Fetches and displays analytics data including:
 * - Key performance metrics (users, sessions, skills)
 * - User registration trends over time
 * - Skills requested and offered comparisons
 *
 * Shows loading skeletons during data fetch
 *
 * @returns {JSX.Element} The complete admin dashboard UI
 */
export default function DashboardContent() {
  // State to hold dashboard data, initially null until fetched
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [skillListData, setSkillListData] = useState<SkillListData[]>([]);
  const [skillListLoading, setSkillListLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  // Effect hook to fetch dashboard data when component mounts
  useEffect(() => {
    /**
     * Fetches dashboard analytics data from the API
     *
     * @async
     * @returns {Promise<void>}
     */
    async function fetchData() {
      try {
        setLoading(true);
        // Call the admin dashboard API endpoint
        const res = await fetch(DASHBOARD_API_URL);

        // Parse JSON response
        const json = await res.json();

        // Process registration data to add Date objects for easier filtering
        if (json.userRegistrationData) {
          json.userRegistrationData = json.userRegistrationData.map(
            (item: any) => {
              // Create a date object from year/month/day (if available)
              const day = item._id.day || 1; // Default to first day if day is not provided
              const date = new Date(item._id.year, item._id.month - 1, day);
              return { ...item, date };
            }
          );
        }

        // Update state with fetched data
        setData(json);
      } catch (err) {
        // Handle and log any errors during fetch
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    // Execute the fetch function
    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  // New effect for fetching skill lists
  useEffect(() => {
    async function fetchSkillLists() {
      try {
        setSkillListLoading(true);
        const res = await fetch("/api/admin/skillLists");
        const json = await res.json();
        setSkillListData(json);
      } catch (err) {
        console.error("Failed to fetch skill lists data", err);
      } finally {
        setSkillListLoading(false);
      }
    }

    fetchSkillLists();
  }, []);

  // Prepare category data for doughnut chart
  const categoryChartData = () => {
    const labels: string[] = [];
    const counts: number[] = [];

    skillListData.forEach((category) => {
      labels.push(category.categoryName);
      counts.push(category.skills.length);
    });

    return { labels, counts };
  };

  // Get category chart data
  const categoryData = categoryChartData();

  /**
   * Filter registration data based on the selected time range
   *
   * @param range - Selected time range
   * @returns {Array} Filtered registration data
   */
  const getFilteredRegistrationData = (range: TimeRange) => {
    if (!data || !data.userRegistrationData) return [];

    const now = new Date();
    let cutoffDate: Date;

    switch (range) {
      case "today":
        cutoffDate = new Date(now);
        cutoffDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case "month":
        cutoffDate = new Date(now);
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      case "year":
      default:
        cutoffDate = new Date(now);
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
    }

    // Filter using the date property we created earlier
    return data.userRegistrationData.filter(
      (item) => item.date && item.date >= cutoffDate
    );
  };

  /**
   * Processes user registration data into chart-friendly format based on selected time range
   *
   * @returns {Object} Object containing labels array and counts array for the chart
   */
  const formatUserData = () => {
    const filteredData = getFilteredRegistrationData(timeRange);
    const labels: string[] = [];
    const counts: number[] = [];

    if (filteredData.length > 0) {
      // Determine format based on time range
      if (timeRange === "today") {
        // Group by hours
        const hourData: { [hour: number]: number } = {};

        filteredData.forEach((item) => {
          if (item.date) {
            const hour = item.date.getHours();
            hourData[hour] = (hourData[hour] || 0) + item.count;
          }
        });

        // Fill in all hours
        for (let i = 0; i < 24; i++) {
          labels.push(`${i}:00`);
          counts.push(hourData[i] || 0);
        }
      } else if (timeRange === "week") {
        // Group by day of week
        const dayData: { [day: string]: number } = {};
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        filteredData.forEach((item) => {
          if (item.date) {
            const dayIndex = item.date.getDay();
            const dayName = dayNames[dayIndex];
            dayData[dayName] = (dayData[dayName] || 0) + item.count;
          }
        });

        // Get last 7 days in order
        const today = new Date().getDay();
        for (let i = 6; i >= 0; i--) {
          const dayIndex = (today - i + 7) % 7;
          const dayName = dayNames[dayIndex];
          labels.push(dayName);
          counts.push(dayData[dayName] || 0);
        }
      } else {
        // For month or year view, create a map to aggregate by month-year
        const dataMap: { [key: string]: number } = {};

        filteredData.forEach((item) => {
          if (item._id && item.date) {
            const monthName = MONTHS[item._id.month - 1];
            const year = item._id.year;
            const key = `${monthName} ${year}`;

            // Aggregate counts for the same month-year
            dataMap[key] = (dataMap[key] || 0) + item.count;
          }
        });

        // Sort the entries by date to ensure chronological order
        const sortedEntries = Object.entries(dataMap).sort((a, b) => {
          const [monthA, yearA] = a[0].split(" ");
          const [monthB, yearB] = b[0].split(" ");

          const yearDiff = parseInt(yearA) - parseInt(yearB);
          if (yearDiff !== 0) return yearDiff;

          return MONTHS.indexOf(monthA) - MONTHS.indexOf(monthB);
        });

        // Extract sorted labels and counts
        sortedEntries.forEach(([label, count]) => {
          labels.push(label);
          counts.push(count);
        });
      }
    }

    return { labels, counts };
  };

  // Handle time range change
  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(e.target.value as TimeRange);
  };

  // Get formatted user data for charts
  const userData = formatUserData();

  // Show skeleton loader while data is being fetched
  if (loading || !data) {
    return (
      <div className="p-8 grid gap-8">
        {/* Skeleton for Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>

        {/* Skeleton for Line Chart */}
        <SkeletonChart />

        {/* Skeleton for Bar Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  // Extract skill names for chart labels
  const skillLabels = data.skillsData.map((skill) => skill.skill);

  return (
    <div className="p-8 grid gap-8">
      {/* Top Stats Section - Key metrics displayed as cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title={CHART_LABELS.statTitles.totalUsers}
          value={data.totalUsers.toString()}
        />
        <StatCard
          title={CHART_LABELS.statTitles.noOfSessions}
          value={data.sessions.toString()}
        />
        <StatCard
          title={CHART_LABELS.statTitles.newUsersThisWeek}
          value={
            data.newUsersThisWeek !== undefined
              ? data.newUsersThisWeek.toString()
              : "0"
          }
        />
        <StatCard
          title={CHART_LABELS.statTitles.skillMatchRate}
          value={
            data.skillsRequested > 0
              ? `${Math.round((data.matches / data.skillsRequested) * 100)}%`
              : "0%"
          }
        />
        <StatCard
          title={CHART_LABELS.statTitles.noOfSkillsRequested}
          value={data.skillsRequested.toString()}
        />
      </div>

      {/* Line Chart - Showing user registration data over time */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {CHART_LABELS.userRegistration}
          </h2>
          <div className="relative">
            <select
              value={timeRange}
              onChange={handleTimeRangeChange}
              className="appearance-none bg-blue-50 border border-blue-200 text-blue-800 py-2 px-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              aria-label="Select time range"
            >
              <option value="today">{CHART_LABELS.timeRanges.today}</option>
              <option value="week">{CHART_LABELS.timeRanges.week}</option>
              <option value="month">{CHART_LABELS.timeRanges.month}</option>
              <option value="year">{CHART_LABELS.timeRanges.year}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-800">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                  fillRule="evenodd"
                ></path>
              </svg>
            </div>
          </div>
        </div>

        {userData.labels.length > 0 ? (
          <Line
            data={{
              labels: userData.labels,
              datasets: [
                {
                  label: CHART_LABELS.numberOfUsers,
                  data: userData.counts,
                  backgroundColor: COLORS.blue.fill,
                  borderColor: COLORS.blue.border,
                  tension: 0.3, // Add smooth curves to the line
                  fill: true, // Fill area under the line
                  pointBackgroundColor: COLORS.blue.border,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                },
              ],
            }}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    precision: 0, // Use integers only
                  },
                },
              },
              plugins: {
                tooltip: {
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  padding: 10,
                  titleFont: {
                    weight: "bold",
                  },
                },
              },
            }}
          />
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">
              No registration data available for the selected time range
            </p>
          </div>
        )}
      </div>

      {/* Doughnut Chart - Skill Distribution by Category */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">
          {CHART_LABELS.skillDistribution}
        </h2>
        <div className="h-80">
          {skillListLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : skillListData.length > 0 ? (
            <Doughnut
              data={{
                labels: categoryData.labels,
                datasets: [
                  {
                    data: categoryData.counts,
                    backgroundColor: COLORS.categoryColors.slice(
                      0,
                      categoryData.labels.length
                    ),
                    borderColor: COLORS.categoryBorders.slice(
                      0,
                      categoryData.labels.length
                    ),
                    borderWidth: 2,
                    borderRadius: 5, // Add rounded corners to segments
                    hoverOffset: 10, // Expand segments on hover
                    hoverBorderWidth: 3, // Thicker border on hover
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "65%", // Make the doughnut hole larger
                plugins: {
                  legend: {
                    position: "bottom", // Move legend to bottom
                    align: "center",
                    labels: {
                      boxWidth: 12,
                      padding: 20,
                      font: {
                        size: 11,
                      },
                      usePointStyle: true, // Use circular legend markers
                      pointStyle: "circle",
                    },
                  },
                  tooltip: {
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    padding: 12,
                    titleFont: {
                      weight: "bold",
                      size: 14,
                    },
                    callbacks: {
                      label: (context) => {
                        const label = context.label || "";
                        const value = context.raw as number;
                        const total =
                          context.chart.data.datasets[0].data.reduce(
                            (sum: number, val: any) => sum + val,
                            0
                          );
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} skills (${percentage}%)`;
                      },
                    },
                  },
                },
                animation: {
                  animateRotate: true,
                  animateScale: true, // Add scale animation
                },
                layout: {
                  padding: 10, // Add padding around the chart
                },
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">No skill category data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * StatCard - Reusable component for displaying individual metric cards
 */
function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-blue-100 rounded-xl p-4 flex flex-col justify-center items-center shadow-sm">
      <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-blue-800">{value}</p>
    </div>
  );
}
