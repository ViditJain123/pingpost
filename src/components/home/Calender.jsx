"use client";

import React, { useState, useEffect } from "react";
import { generateCalendarDays } from "@/utils/generateCalender";
import axios from "axios";

const Calendar = ({ year, month, tasks, onTaskAdd, onTaskRemove }) => {
  const [currentDate, setCurrentDate] = useState({ year, month });
  const calendarDays = generateCalendarDays(currentDate.year, currentDate.month);
  const dayLabels = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  const [userTimezone, setUserTimezone] = useState("UTC");

  useEffect(() => {
    // Fetch user's timezone when component mounts
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('/api/user/profile');
        if (response.data?.linkedinSpecs?.timezone) {
          setUserTimezone(response.data.linkedinSpecs.timezone);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  const handlePreviousMonth = () => {
    setCurrentDate(prev => {
      const newMonth = prev.month - 1;
      if (newMonth < 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: newMonth };
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newMonth = prev.month + 1;
      if (newMonth > 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: newMonth };
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();    
    e.currentTarget.classList.add('bg-gray-50');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-gray-50');
  };

  const handleDrop = async (e, date) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-50');
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      // Extract date components from the dropped date   
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      
      // Get current date and time
      const now = new Date();
      
      // Create the schedule date using the calendar date
      // For today's date, use current hour + 1 to ensure it's in the future
      // For other dates, use noon as default time
      let scheduleDate;
      
      const isToday = 
        now.getFullYear() === year && 
        now.getMonth() === month && 
        now.getDate() === day;
      
      if (isToday) {
        // For today, set time to current hour + 1
        const futureHour = now.getHours() + 1;
        scheduleDate = new Date(year, month, day, futureHour, 0, 0, 0);
      } else {
        // For other days, use noon as before
        scheduleDate = new Date(year, month, day, 12, 0, 0, 0);
      }
      
      const formattedDate = scheduleDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const task = {
        ...data,
        date: formattedDate, // For calendar display
        scheduleTime: scheduleDate.toISOString(), // For API
        status: 'draft',
      };
      
      console.log(`Calendar: Scheduling post for date: ${formattedDate} (${scheduleDate.toISOString()}) in timezone ${userTimezone}`);
      
      // Call the parent function to schedule the task
      await onTaskAdd(task);
    } catch (err) {
      console.error('Failed to schedule post:', err);
      // Error handling is now managed by the parent component
    }
  };

  // Get task background color based on status
  const getTaskColor = (status) => {
    switch(status) {
      case 'published':
        return 'bg-gray-200 text-gray-700';
      case 'scheduled':
        return 'bg-[#FAE2EC] text-[#1F1F1F]';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-[#FAE2EC] text-[#1F1F1F]';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-[20px] p-8">
      {/* Month and Year Header with Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 className="text-[32px] font-semibold text-[#1F1F1F]">
          {new Intl.DateTimeFormat("en-US", { 
            month: "long"
          }).format(new Date(currentDate.year, currentDate.month))}{" "}
          {currentDate.year}
        </h2>
        <button 
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-gray-200 my-6" />
      
      {/* Timezone info */}
      <div className="mb-2 text-xs text-gray-500">
        Timezone: {userTimezone}
      </div>

      {/* Scrollable container */}
      <div className="flex-1 overflow-y-auto">
        {/* Weekday labels */}
        <div className="grid grid-cols-7 mb-4 sticky top-0 bg-white pt-2">
          {dayLabels.map((label) => (
            <div 
              key={label} 
              className="flex items-center justify-center text-sm text-[#8A8A8A]"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((dateObj, idx) => {
            const isPlaceholder = dateObj.getTime() === 0;
            const isCurrentMonth = dateObj.getMonth() === currentDate.month;
            const dateStr = isPlaceholder ? '' : dateObj.toISOString().split('T')[0];
            const dayTasks = isPlaceholder ? [] : tasks.filter(task => task.date === dateStr);

            return (
              <div
                key={idx}
                className="aspect-square relative"
              >
                {!isPlaceholder && (
                  <div 
                    className={`
                      w-full h-full
                      rounded-lg
                      ${isCurrentMonth ? 'bg-white' : 'bg-[#F9F9F9]'}
                      border border-[#E5E5E5]
                      flex flex-col
                      transition-all
                      hover:border-[#1a1a1a]
                      cursor-pointer
                      p-2
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dateObj)}
                  >
                    <span className={`
                      text-[15px] font-medium
                      ${isCurrentMonth ? 'text-[#1F1F1F]' : 'text-[#9B9B9B]'}
                    `}>
                      {dateObj.getDate()}
                    </span>
                    <div className="flex-1 mt-1 overflow-y-auto">
                      {dayTasks.map(task => (
                        <div 
                          key={task.id}
                          className={`${getTaskColor(task.status)} text-sm p-1 rounded mb-1 flex items-center justify-between animate-fade-in group`}
                        >
                          <span className="truncate flex-1">{task.title}</span>
                          {task.status !== 'published' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTaskRemove(task.id);
                              }}
                              className="ml-1 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              title={task.status === 'scheduled' ? "Cancel scheduled post" : "Remove"}
                            >
                              {task.status === 'scheduled' ? '⨯' : '×'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;