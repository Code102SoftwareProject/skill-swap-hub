"use client";

import React, { useState } from "react";
import { X, Clock, Monitor, ChevronLeft, ChevronRight } from "lucide-react";

interface MeetingOverlayProps {
  onClose: () => void;
  receiverName?: string;
  receiverId?: string;
}

export default function MeetingOverlay({ 
  onClose, 
  receiverName = "Joey", 
  receiverId 
}: MeetingOverlayProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState("10");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [amPm, setAmPm] = useState("AM");
  const [timeZone, setTimeZone] = useState("Central European Time (8:11pm)");

  // Current month and year for calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Calendar navigation functions
  const previousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };
  
  const nextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };
  
  // Generate calendar grid
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };
  
  const handleRequestMeeting = () => {
    console.log("Meeting requested with", receiverName, "on", selectedDate, "at", `${selectedHour}:${selectedMinute} ${amPm}`);
    onClose();
  };
  
  const days = generateCalendarDays();
  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const year = currentMonth.getFullYear();
  
  const isSelectableDay = (day: number) => {
    const today = new Date();
    const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return dateToCheck >= today;
  };

  // Days of the week
  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border-2 border-gray-300 shadow-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-auto flex flex-col md:flex-row">
        {/* Left side - Calendar */}
        <div className="flex-1 border-r border-gray-200 pr-6">
          <h2 className="font-medium text-lg mb-5">Select a Date & Time</h2>
          
          {/* Month navigation */}
          <div className="flex justify-between items-center mb-4">
            <button onClick={previousMonth} className="text-gray-600 hover:bg-gray-100 p-1.5 rounded">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-base font-medium">{monthName} {year}</h3>
            <button onClick={nextMonth} className="text-gray-600 hover:bg-gray-100 p-1.5 rounded">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2 mb-5">
            {/* Day headers */}
            {daysOfWeek.map((day, i) => (
              <div key={i} className="text-xs text-gray-500 text-center py-1 border-b border-gray-100">{day}</div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => (
              <div key={index} className="aspect-square flex items-center justify-center p-0.5">
                {day !== null ? (
                  <button 
                    className={`w-9 h-9 rounded-full text-center text-sm transition-colors
                      ${selectedDate?.getDate() === day && 
                        selectedDate?.getMonth() === currentMonth.getMonth() ? 
                        'bg-blue-500 text-white' : 
                        isSelectableDay(day) ? 
                          'hover:bg-blue-100 text-gray-700' : 
                          'text-gray-300 cursor-not-allowed'
                      }
                    `}
                    onClick={() => isSelectableDay(day) && setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                    disabled={!isSelectableDay(day)}
                  >
                    {day}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          
          {/* Time zone selector */}
          <div className="mt-5 mb-4 border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Time zone</label>
            <div className="relative">
              <select 
                className="appearance-none w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white"
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
              >
                <option value="Central European Time (8:11pm)">Central European Time (8:11pm)</option>
                <option value="Eastern Time (2:11pm)">Eastern Time (2:11pm)</option>
                <option value="Pacific Time (11:11am)">Pacific Time (11:11am)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Time selector */}
          <div className="mt-4 flex items-center gap-2">
            <select 
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 w-16"
              value={selectedHour}
              onChange={(e) => setSelectedHour(e.target.value)}
            >
              {Array.from({length: 12}, (_, i) => i + 1).map(hour => (
                <option key={hour} value={hour < 10 ? `0${hour}` : `${hour}`}>{hour}</option>
              ))}
            </select>
            <span className="text-base font-medium">:</span>
            <select 
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 w-16"
              value={selectedMinute}
              onChange={(e) => setSelectedMinute(e.target.value)}
            >
              {['00','15','30','45'].map(min => (
                <option key={min} value={min}>{min}</option>
              ))}
            </select>
            <select 
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 w-16"
              value={amPm}
              onChange={(e) => setAmPm(e.target.value)}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
        
        {/* Right side - Meeting details */}
        <div className="w-72 pl-6 flex items-center">
          <div className="flex flex-col items-center text-center w-full">
            {/* User avatar */}
            <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center overflow-hidden mb-4 border-2 border-gray-100 shadow">
              <img src="/avatar-placeholder.jpg" alt="" className="w-full h-full object-cover" />
            </div>
            
            <div className="text-xs text-gray-500 mb-2">Account name</div>
            <h2 className="text-lg font-medium mb-5">Meeting with {receiverName}</h2>
            
            {/* Meeting duration */}
            <div className="flex items-center mb-4 text-gray-600 bg-gray-50 px-4 py-2 rounded-md border border-gray-100 w-full justify-center">
              <Clock className="w-4 h-4 mr-2" />
              <span className="text-sm">30 min</span>
            </div>
            
            {/* Meeting details */}
            <div className="flex items-start mb-8 text-gray-600 bg-gray-50 px-4 py-3 rounded-md border border-gray-100 w-full">
              <Monitor className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-left">Web conferencing details provided upon confirmation.</span>
            </div>
            
            {/* Request button */}
            <button 
              className="w-full bg-blue-700 text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-blue-800 transition-colors border border-blue-800"
              onClick={handleRequestMeeting}
              disabled={!selectedDate}
            >
              Request a Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}