"use client";

import React, { useState, useEffect } from "react";
import { generateCalendarDays } from "@/utils/generateCalender";
import axios from "axios";

const Calendar = ({ year, month, tasks, onTaskAdd, onTaskRemove }) => {
  const [currentDate, setCurrentDate] = useState({ year, month });
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const calendarDays = generateCalendarDays(currentDate.year, currentDate.month);
  const dayLabels = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  const [userTimezone, setUserTimezone] = useState("UTC");
  
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

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
  
  useEffect(() => {
    // Handle click outside to close the month dropdown
    const handleClickOutside = (event) => {
      if (showMonthDropdown && !event.target.closest('.month-dropdown-container')) {
        setShowMonthDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMonthDropdown]);

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
  
  const handleMonthSelect = (monthIndex) => {
    setCurrentDate(prev => ({ ...prev, month: monthIndex }));
    setShowMonthDropdown(false);
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
    <div className="w-full h-full flex flex-col bg-white rounded-[20px] p-2 overflow-hidden">
      {/* Month and Year Header with Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePreviousMonth}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="relative month-dropdown-container">
          <button 
            className="text-xl font-semibold text-[#1F1F1F] flex items-center gap-1 hover:bg-gray-50 px-2 py-1 rounded-md"
            onClick={() => setShowMonthDropdown(!showMonthDropdown)}
          >
            {new Intl.DateTimeFormat("en-US", { 
              month: "short"
            }).format(new Date(currentDate.year, currentDate.month))}{" "}
            {currentDate.year}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {showMonthDropdown && (
            <div className="absolute z-10 mt-1 bg-white rounded-md shadow-lg border border-gray-200 w-48 max-h-60 overflow-y-auto">
              <ul className="py-1">
                {months.map((monthName, index) => (
                  <li key={monthName}>
                    <button
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                        currentDate.month === index ? "bg-gray-50 font-medium" : ""
                      }`}
                      onClick={() => handleMonthSelect(index)}
                    >
                      {monthName}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button 
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-gray-200 my-2" />
      
      {/* Timezone info */}
      <div className="mb-1 text-xs text-gray-500">
        Timezone: {userTimezone}
      </div>

      {/* Calendar container (non-scrollable) */}
      <div className="flex-1 flex flex-col">
        {/* Weekday labels */}
        <div className="grid grid-cols-7 mb-1 bg-white pt-1">
          {dayLabels.map((label) => (
            <div 
              key={label} 
              className="flex items-center justify-center text-xs text-[#8A8A8A]"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 flex-1 auto-rows-fr">
          {calendarDays.map((dateObj, idx) => {
            const isPlaceholder = dateObj.getTime() === 0;
            const isCurrentMonth = dateObj.getMonth() === currentDate.month;
            const dateStr = isPlaceholder ? '' : dateObj.toISOString().split('T')[0];
            const dayTasks = isPlaceholder ? [] : tasks.filter(task => task.date === dateStr);

            return (
              <div
                key={idx}
                className="h-full w-full relative"
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
                      p-1
                      min-h-[70px]
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dateObj)}
                  >
                    <span className={`
                      text-[12px] font-medium
                      ${isCurrentMonth ? 'text-[#1F1F1F]' : 'text-[#9B9B9B]'}
                    `}>
                      {dateObj.getDate()}
                    </span>
                    <div className="flex-1 mt-1 overflow-hidden max-h-[80%]">
                      {dayTasks.slice(0, 3).map(task => (
                        <div 
                          key={task.id}
                          className={`${getTaskColor(task.status)} text-xs p-1 rounded mb-1 flex items-center justify-between animate-fade-in group`}
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
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-gray-500 text-center mt-1">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
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