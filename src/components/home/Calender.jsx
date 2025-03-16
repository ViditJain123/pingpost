"use client";

import React, { useState } from "react";
import { generateCalendarDays } from "@/utils/generateCalender";

const Calendar = ({ year, month, tasks, onTaskAdd, onTaskRemove }) => {
  const [currentDate, setCurrentDate] = useState({ year, month });
  const calendarDays = generateCalendarDays(currentDate.year, currentDate.month);
  const dayLabels = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

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

  const handleDrop = (e, date) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-50');
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      // Set the time to 12:00 PM for the selected date by default
      const scheduleDate = new Date(date);
      scheduleDate.setHours(12, 0, 0, 0);
      
      const dateStr = date.toISOString().split('T')[0];
      onTaskAdd({ 
        ...data, 
        date: dateStr,
        scheduleTime: scheduleDate.toISOString()  // Include the full ISO timestamp
      });
    } catch (err) {
      console.error('Failed to parse drag data:', err);
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
            const dateStr = dateObj.toISOString().split('T')[0];
            const dayTasks = tasks.filter(task => task.date === dateStr);

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
                          className="bg-[#FAE2EC] text-sm p-1 rounded mb-1 flex items-center justify-between animate-fade-in group"
                        >
                          <span className="truncate flex-1">{task.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskRemove(task.id);
                            }}
                            className="ml-1 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            ×
                          </button>
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