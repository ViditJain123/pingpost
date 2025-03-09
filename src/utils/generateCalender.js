
export function generateCalendarDays(year, month) {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
  
    const firstDayIndex = firstDayOfMonth.getDay();
  
    const shiftForMonday = (dayIndex) => (dayIndex === 0 ? 6 : dayIndex - 1);
    const startIndex = shiftForMonday(firstDayIndex);
  
    const totalDaysInMonth = lastDayOfMonth.getDate();
  
    const daysArray = [];
  
    for (let i = 0; i < startIndex; i++) {
      daysArray.push(new Date(0));
    }
  
    for (let day = 1; day <= totalDaysInMonth; day++) {
      daysArray.push(new Date(year, month, day));
    }
  
    return daysArray;
  }