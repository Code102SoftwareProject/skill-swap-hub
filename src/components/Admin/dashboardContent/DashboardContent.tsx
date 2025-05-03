"use client"; // Indicates this is a client component in Next.js

import { useEffect, useState } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
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
  ArcElement,
} from "chart.js";

// Import the internationalization config
import chartLabels, { ChartLabels, Locale } from "@/config/localization";

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
  ArcElement
);

// Colors for charts
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
type TimeRange = "today" | "week" | "month" | "year" | "all";

// Array of month names for date formatting
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

// API endpoint for dashboard data
const DASHBOARD_API_URL = "/api/admin/dashboard";

// Define the structure of dashboard data we expect from the API
interface DashboardData {
  totalUsers: number;
  sessions: number;
  newUsersThisWeek: number;
  skillsOffered: number;
  skillsRequested: number;
  matches: number;
  skillsData: { skill: string; requests: number; offers: number }[];
  userRegistrationData: {
    _id: { year: number; month: number; day?: number };
    count: number;
    date?: Date;
  }[];
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
 */
export default function DashboardContent() {
  // State to hold dashboard data, initially null until fetched
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [skillListData, setSkillListData] = useState<SkillListData[]>([]);
  const [skillListLoading, setSkillListLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  // Add new state for filtered user metrics
  const [filteredMetrics, setFilteredMetrics] = useState({
    totalUsers: 0,
    newUsers: 0,
  });
  // Set the default locale - could be loaded from user preferences/settings
  const [locale, setLocale] = useState<Locale>("en-US");
  // Get the labels for the current locale
  const labels = chartLabels[locale];

  // Effect hook to fetch dashboard data when component mounts
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(DASHBOARD_API_URL);
        const json = await res.json();

        console.log("Raw registration data:", json.userRegistrationData);

        // Process and convert the dates in the user registration data
        if (
          json.userRegistrationData &&
          Array.isArray(json.userRegistrationData)
        ) {
          json.userRegistrationData = json.userRegistrationData.map(
            (item: {
              _id?: { year: number; month: number; day?: number };
              count: number;
              date?: Date;
            }) => {
              // Create a proper date from the _id fields using UTC
              if (item._id) {
                const year = item._id.year;
                const month = item._id.month - 1; // JavaScript months are 0-indexed
                const day = item._id.day || 1; // Default to 1st day if not specified

                // Create Date object using UTC to avoid timezone shifts
                const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}T12:00:00Z`;
                item.date = new Date(dateStr);

                // Debug the created date
                console.log(
                  `Created date: ${item.date.toISOString()} from year=${year}, month=${month + 1}, day=${day}`
                );

                // Validate the created date
                if (isNaN(item.date.getTime())) {
                  console.error("Invalid date created:", {
                    year,
                    month: month + 1,
                    day,
                    dateStr,
                  });
                }
              } else {
                console.warn("Registration item without _id field:", item);
              }
              return item;
            }
          );
        }

        console.log("Processed registration data:", json.userRegistrationData);
        setData(json);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Effect for fetching skill lists
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

  // Effect to update filtered metrics when time range changes or data loads
  useEffect(() => {
    if (data && data.userRegistrationData) {
      const filteredData = getFilteredRegistrationData(timeRange);
      // Calculate total users in the filtered time range
      const newUsersInRange = filteredData.reduce(
        (sum, item) => sum + item.count,
        0
      );

      // Log comparison between total users and sum of registration counts
      if (timeRange === "all") {
        const totalFromRegistrations = data.userRegistrationData.reduce(
          (sum, item) => sum + item.count,
          0
        );
        console.log("User Count Comparison:");
        console.log("Total users reported by API:", data.totalUsers);
        console.log("Sum of all registration counts:", totalFromRegistrations);
        console.log("Difference:", data.totalUsers - totalFromRegistrations);

        // Log entries with potential date issues
        const entriesWithDateIssues = data.userRegistrationData.filter(
          (item) =>
            !item.date ||
            !(item.date instanceof Date) ||
            isNaN(item.date.getTime())
        );
        console.log("Entries with invalid dates:", entriesWithDateIssues);
      }

      setFilteredMetrics({
        totalUsers: data.totalUsers,
        newUsers: newUsersInRange,
      });
    }
  }, [timeRange, data]);

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
   */
  const getFilteredRegistrationData = (range: TimeRange) => {
    if (!data || !data.userRegistrationData) return [];

    // For "all", return all data without filtering
    if (range === "all") {
      return data.userRegistrationData;
    }

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
    const filtered = data.userRegistrationData.filter((item) => {
      if (!item.date || !(item.date instanceof Date)) {
        return false;
      }
      return item.date >= cutoffDate;
    });

    return filtered;
  };

  /**
   * Generate date points for a given time range
   */
  const generateDatePointsForRange = (range: TimeRange) => {
    const now = new Date();
    const datePoints: { date: Date; label: string; count: number }[] = [];

    // Generate all expected date points based on time range
    if (range === "today") {
      // Generate 24 hourly points for today
      for (let i = 0; i < 24; i++) {
        const date = new Date(now);
        date.setHours(i, 0, 0, 0);
        // Format hour with localization
        const formattedTime = date.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: locale === "en-US", // Use 12-hour format for US English
        });

        datePoints.push({
          date,
          label: formattedTime,
          count: 0, // Default count
        });
      }
    } else if (range === "week") {
      // Generate 7 daily points for the last week
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const formattedDate = `${dayNames[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;

        datePoints.push({
          date,
          label: formattedDate,
          count: 0,
        });
      }
    } else if (range === "month") {
      // Generate 30 daily points for the last month
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        datePoints.push({
          date,
          label: `${date.getDate()} ${MONTHS[date.getMonth()]}`,
          count: 0,
        });
      }
    } else if (range === "year") {
      // Generate 12 monthly points for the last year
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        date.setDate(1); // First day of month
        date.setHours(0, 0, 0, 0);
        datePoints.push({
          date,
          label: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
          count: 0,
        });
      }
    } else if (range === "all") {
      // For "all" option, we'll create points based on the date range in the data
      if (
        data &&
        data.userRegistrationData &&
        data.userRegistrationData.length > 0
      ) {
        // Find the earliest and latest dates in the data
        let earliestDate = new Date();
        let latestDate = new Date(0); // January 1, 1970

        data.userRegistrationData.forEach((item) => {
          if (item.date && item.date instanceof Date) {
            if (item.date < earliestDate) earliestDate = new Date(item.date);
            if (item.date > latestDate) latestDate = new Date(item.date);
          }
        });

        // Set to beginning of month for earliest date
        earliestDate.setDate(1);
        earliestDate.setHours(0, 0, 0, 0);

        // Set to end of month for latest date
        latestDate = new Date(now);

        // Generate points for each month between earliest and latest date
        let currentDate = new Date(earliestDate);

        while (currentDate <= latestDate) {
          datePoints.push({
            date: new Date(currentDate),
            label: `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`,
            count: 0,
          });

          // Move to next month
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      } else {
        // Fallback to showing the last year if no data
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          date.setDate(1);
          date.setHours(0, 0, 0, 0);
          datePoints.push({
            date,
            label: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
            count: 0,
          });
        }
      }
    }

    return datePoints;
  };

  /**
   * Check if two dates match according to the required precision for a time range
   *
   * @param date1 First date to compare
   * @param date2 Second date to compare
   * @param precision Precision level for comparison
   * @returns Boolean indicating if dates match at the specified precision
   */
  const datesMatch = (
    date1: Date,
    date2: Date,
    precision: "hour" | "day" | "month"
  ) => {
    if (precision === "hour") {
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate() &&
        date1.getHours() === date2.getHours()
      );
    } else if (precision === "day") {
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
      );
    } else {
      // month
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth()
      );
    }
  };

  // Enhanced user data formatter to ensure we always have data points
  const formatUserData = () => {
    const filteredData = getFilteredRegistrationData(timeRange);

    // Add debug logging
    console.log("Time Range:", timeRange);
    console.log("Filtered Data Count:", filteredData.length);
    console.log(
      "Filtered Data Total Users:",
      filteredData.reduce((sum, item) => sum + item.count, 0)
    );

    // Generate template date points based on time range
    const datePoints = generateDatePointsForRange(timeRange);
    console.log("Date Points Generated:", datePoints.length);

    // Fill in actual data where available
    if (filteredData.length > 0) {
      filteredData.forEach((item) => {
        if (!item.date || !(item.date instanceof Date)) {
          console.log("Skipping item with invalid date:", item);
          return;
        }

        // Select matching precision based on time range
        const precision =
          timeRange === "today"
            ? "hour"
            : timeRange === "year" || timeRange === "all"
              ? "month"
              : "day";

        // For "all" time range, make sure month-level matching works correctly
        if (timeRange === "all") {
          // Find the month point that matches this item
          const matchingPoint = datePoints.find(
            (p) =>
              p.date.getFullYear() === item.date!.getFullYear() &&
              p.date.getMonth() === item.date!.getMonth()
          );

          if (matchingPoint) {
            matchingPoint.count += item.count;
          } else {
            console.log(
              `No matching point found for date: ${item.date} in "all" time range`
            );
            console.log(
              `Item year/month: ${item.date.getFullYear()}/${item.date.getMonth() + 1}`
            );
            console.log(
              `Available points:`,
              datePoints.map(
                (p) => `${p.date.getFullYear()}/${p.date.getMonth() + 1}`
              )
            );
          }
        } else {
          // Regular matching for other time ranges
          const matchingPoint = datePoints.find((p) =>
            datesMatch(p.date, item.date!, precision)
          );

          if (matchingPoint) {
            matchingPoint.count += item.count;
          } else {
            console.log(
              `No matching point found for date: ${item.date} with precision ${precision}`
            );
          }
        }
      });
    }

    // Log the final calculated data
    console.log("Final Chart Data:", {
      labels: datePoints.map((p) => p.label),
      counts: datePoints.map((p) => p.count),
      total: datePoints.reduce((sum, p) => sum + p.count, 0),
    });

    // Extract labels and counts for chart
    const labels = datePoints.map((p) => p.label);
    const counts = datePoints.map((p) => p.count);

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
          title={labels.statTitles.totalUsers}
          value={data.totalUsers.toString()}
        />
        <StatCard
          title={labels.statTitles.noOfSessions}
          value={data.sessions.toString()}
        />
        <StatCard
          title={`${labels.statTitles.newUsersThisWeek.replace("Week", timeRange === "week" ? "Week" : timeRange === "month" ? "Month" : timeRange === "today" ? "Today" : timeRange === "all" ? "All Time" : "Year")}`}
          value={filteredMetrics.newUsers.toString()}
        />
        <StatCard
          title={labels.statTitles.skillMatchRate}
          value={
            data.skillsRequested > 0
              ? `${Math.round((data.matches / data.skillsRequested) * 100)}%`
              : "0%"
          }
        />
        <StatCard
          title={labels.statTitles.noOfSkillsRequested}
          value={data.skillsRequested.toString()}
        />
      </div>

      {/* Line Chart - Showing user registration data over time */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{labels.userRegistration}</h2>
          <div className="relative">
            <select
              value={timeRange}
              onChange={handleTimeRangeChange}
              className="appearance-none bg-blue-50 border border-blue-200 text-blue-800 py-2 px-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              aria-label="Select time range"
            >
              <option value="today">{labels.timeRanges.today}</option>
              <option value="week">{labels.timeRanges.week}</option>
              <option value="month">{labels.timeRanges.month}</option>
              <option value="year">{labels.timeRanges.year}</option>
              <option value="all">All Time</option>
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
          <>
            <Line
              data={{
                labels: userData.labels,
                datasets: [
                  {
                    label: labels.numberOfUsers,
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
            {timeRange === "all" && (
              <div className="mt-4 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>API Total Users: {data.totalUsers}</span>
                  <span>
                    Chart Total:{" "}
                    {userData.counts.reduce((sum, count) => sum + count, 0)}
                  </span>
                  {data.totalUsers !==
                    userData.counts.reduce((sum, count) => sum + count, 0) && (
                    <span className="text-amber-600 font-semibold">
                      Difference:{" "}
                      {data.totalUsers -
                        userData.counts.reduce((sum, count) => sum + count, 0)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
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
          {labels.skillDistribution}
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
