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

import { processAvatarUrl } from '@/utils/avatarUtils';

import VerifiedAvatar from '@/components/VerifiedAvatar';


type UserType = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
};

interface ProfileCardProps {
  userId: string;
}

const ProfileCard = ({ userId }: ProfileCardProps) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

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

  const calendarCells = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
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

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  if (loading) return <div>Loading profile...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-sm">
      <div className="flex flex-col items-center">
        <VerifiedAvatar
          userId={user._id}
          avatarUrl={user.avatar}
          size={96}
        />
        <h2 className="mt-4 text-lg font-semibold text-gray-800">
          {user.firstName} {user.lastName}
        </h2>
        <p className="text-sm text-gray-500">{user.title || 'No title provided'}</p>
      </div>

      <div className="mt-6">
        {renderHeader()}
        {renderDays()}
        <div className="mt-2">{calendarCells}</div>
      </div>
    </div>
  );
};

export default ProfileCard;
