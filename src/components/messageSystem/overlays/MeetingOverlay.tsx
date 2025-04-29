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
  
  // Calendar navigation
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
    
    // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
    let firstDay = new Date(year, month, 1).getDay();
    // Adjust for Monday as first day of week
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add actual days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };
  
  const handleRequestMeeting = () => {
    // Logic to send meeting request
    console.log("Meeting requested with", receiverName, "on", selectedDate, "at", `${selectedHour}:${selectedMinute} ${amPm}`);
    onClose();
  };
  
  const days = generateCalendarDays();
  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const year = currentMonth.getFullYear();
  
  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === currentMonth.getMonth() && 
           today.getFullYear() === currentMonth.getFullYear();
  };
  
  // Check if a day should be selectable (could add logic to disable past days, etc.)
  const isSelectableDay = (day: number) => {
    const today = new Date();
    const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return dateToCheck >= today;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl">
        <h2 className="text-xl font-semibold mb-4">Select a Date & Time</h2>

        <div className="flex flex-col md:flex-row justify-between items-start mb-5">
          <div className="flex-1 w-full md:w-auto">
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={previousMonth} 
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-base font-medium">{monthName} {year}</h3>
              <button 
                onClick={nextMonth} 
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center mb-2">
              <div className="text-xs font-medium">MON</div>
              <div className="text-xs font-medium">TUE</div>
              <div className="text-xs font-medium">WED</div>
              <div className="text-xs font-medium">THU</div>
              <div className="text-xs font-medium">FRI</div>
              <div className="text-xs font-medium">SAT</div>
              <div className="text-xs font-medium">SUN</div>
            </div>
              
            <div className="grid grid-cols-7 gap-2 text-center">
              {days.map((day, index) => (
                <div key={index} className="h-8 flex items-center justify-center">
                  {day !== null ? (
                    <button 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                        ${selectedDate?.getDate() === day && 
                          selectedDate?.getMonth() === currentMonth.getMonth() ? 
                          'bg-blue-500 text-white' : 
                          isSelectableDay(day) ? 
                            'hover:bg-gray-100' : 
                            'text-gray-300 cursor-not-allowed'
                        }
                      `}
                      onClick={() => isSelectableDay(day) && setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                      disabled={!isSelectableDay(day)}
                    >
                      {day}
                    </button>
                  ) : (
                    <span></span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 md:ml-6">
            <div className="flex md:block items-center">
              <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center overflow-hidden mr-3 md:mr-0 md:mb-2">
                <img src="/avatar-placeholder.jpg" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="md:text-center">
                <div className="text-xs text-gray-500">Account name</div>
                <h3 className="text-base font-medium">Meeting with {receiverName}</h3>
              </div>
            </div>
            
            <div className="mt-3 text-sm">
              <div className="flex items-center mb-2">
                <Clock className="w-4 h-4 text-gray-500 mr-2" />
                <span>30 min</span>
              </div>
              <div className="flex items-start">
                <Monitor className="w-4 h-4 text-gray-500 mr-2 mt-1 flex-shrink-0" />
                <span className="text-gray-600 text-xs">Web conferencing details provided upon confirmation.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Time zone */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Time zone</h4>
          <div className="relative">
            <select 
              className="w-full border rounded p-2 pr-8 appearance-none bg-white text-sm"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
            >
              <option value="Central European Time (8:11pm)">Central European Time (8:11pm)</option>
              <option value="Eastern Time (2:11pm)">Eastern Time (2:11pm)</option>
              <option value="Pacific Time (11:11am)">Pacific Time (11:11am)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {/* Time selection */}
        <div className="flex items-center gap-2 mb-5">
          <div className="relative">
            <select 
              className="border rounded py-2 px-3 appearance-none pr-8 text-sm"
              value={selectedHour}
              onChange={(e) => setSelectedHour(e.target.value)}
            >
              {Array.from({length: 12}, (_, i) => i + 1).map(hour => (
                <option key={hour} value={hour < 10 ? `0${hour}` : `${hour}`}>
                  {hour}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          <span>:</span>
          <div className="relative">
            <select 
              className="border rounded py-2 px-3 appearance-none pr-8 text-sm"
              value={selectedMinute}
              onChange={(e) => setSelectedMinute(e.target.value)}
            >
              <option value="00">00</option>
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="45">45</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          <div className="relative">
            <select 
              className="border rounded py-2 px-3 appearance-none pr-8 text-sm"
              value={amPm}
              onChange={(e) => setAmPm(e.target.value)}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <button 
          className="w-full bg-blue-600 text-white p-3 rounded font-medium hover:bg-blue-700"
          onClick={handleRequestMeeting}
          disabled={!selectedDate}
        >
          Request a Meeting
        </button>
      </div>
    </div>
  );
}