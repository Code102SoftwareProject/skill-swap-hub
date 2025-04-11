'use client';

import { useState } from 'react';
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
  parse,
} from 'date-fns';
import Image from 'next/image';

const ProfileCard = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center text-sm text-gray-700 mb-2">
        <button onClick={prevMonth} className="p-1 font-bold">&lt;</button>
        <p className="font-medium">{format(currentMonth, 'MMMM yyyy')}</p>
        <button onClick={nextMonth} className="p-1 font-bold">&gt;</button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const date = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-xs text-center text-gray-500">
          {date[i]}
        </div>
      );
    }
    return <div className="grid grid-cols-7 gap-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfMonth(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;

        const isToday = isSameDay(day, new Date());
        const isSelected = isSameDay(day, selectedDate);

        days.push(
          <div key={day.toString()} className="text-center">
            <button
              onClick={() => setSelectedDate(cloneDay)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                !isSameMonth(day, monthStart)
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
        <div className="grid grid-cols-7 gap-2" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return <div className="mt-2">{rows}</div>;
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-sm">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-full overflow-hidden">
          <Image
            src="/profile.png"
            alt="Profile"
            width={96}
            height={96}
            className="object-cover w-full h-full"
          />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Maietry Prajapati</h2>
        <p className="text-sm text-gray-500">College Student</p>
      </div>

      <div className="mt-6">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>
    </div>
  );
};

export default ProfileCard;
