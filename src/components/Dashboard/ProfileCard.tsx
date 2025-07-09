'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import Image from 'next/image';

// Define the shape of the user object returned from API
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  title: string;
  avatar: string;
}

// API response shape
interface UserApiResponse {
  success: boolean;
  user?: User;
  message?: string;
}

const ProfileCard = ({ userId }: { userId: string }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data from API based on the userId
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/profile?id=${userId}`);
        const data: UserApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch user data');
        }

        if (data.success && data.user) {
          setUser(data.user);
        } else {
          throw new Error('User not found in response');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // Move to the next month
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  // Move to the previous month
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Render calendar header with month/year and nav buttons
  const renderHeader = () => (
    <div className="flex justify-between items-center text-sm text-gray-700 mb-2">
      <button onClick={prevMonth} className="p-1 font-bold" aria-label="Previous Month">
        &lt;
      </button>
      <p className="font-medium">{format(currentMonth, 'MMMM yyyy')}</p>
      <button onClick={nextMonth} className="p-1 font-bold" aria-label="Next Month">
        &gt;
      </button>
    </div>
  );

  // Render day initials (S, M, T, W, T, F, S)
  const renderDays = () => {
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return (
      <div className="grid grid-cols-7 gap-2">
        {weekdays.map((day, index) => (
          <div key={index} className="text-xs text-center text-gray-500">
            {day}
          </div>
        ))}
      </div>
    );
  };

  // Generate all calendar cells for current month (memoized for performance)
  const calendarCells = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfMonth(currentMonth);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = day;

        const isToday = isSameDay(day, new Date());
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div key={format(day, 'yyyy-MM-dd')} className="text-center">
            <button
              onClick={() => setSelectedDate(cloneDay)}
              aria-label={`Select ${format(cloneDay, 'PPP')}`}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                !isCurrentMonth
                  ? 'text-gray-400'
                  : isSelected
                  ? 'bg-black text-white ring-2 ring-indigo-400'
                  : isToday
                  ? 'border border-black text-black'
                  : 'hover:bg-gray-200 text-gray-800'
              }`}
            >
              {formattedDate}
            </button>
          </div>
        );

        day = addDays(day, 1);
      }

      rows.push(
        <div className="grid grid-cols-7 gap-2" key={`week-${format(day, 'yyyy-MM-dd')}`}>
          {days}
        </div>
      );

      days = [];
    }

    return rows;
  }, [currentMonth, selectedDate]);

  // Conditional loading state
  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-sm flex justify-center items-center h-64">
        <p>Loading profile...</p>
      </div>
    );
  }

  // Show error if data fetch fails
  if (error) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-sm flex justify-center items-center h-64">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  // Show if user is not found
  if (!user) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-sm flex justify-center items-center h-64">
        <p>User not found</p>
      </div>
    );
  }

  // Final render of the Profile Card with user info and calendar
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-sm">
      {/* Profile Image & Info */}
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-full overflow-hidden">
          <Image
            src={user.avatar || '/profile.png'}
            alt="Profile"
            width={96}
            height={96}
            className="object-cover w-full h-full"
          />
        </div>
        <h2 className="mt-4 text-lg font-semibold">
          {user.firstName} {user.lastName}
        </h2>
        <p className="text-sm text-gray-500">{user.title || 'No title provided'}</p>
      </div>

      {/* Calendar UI */}
      <div className="mt-6">
        {renderHeader()}
        {renderDays()}
        <div className="mt-2">{calendarCells}</div>
      </div>
    </div>
  );
};

export default ProfileCard;
