import React from 'react';

const DateRangeFilter = ({ onChange }) => (
  <div className="flex items-center space-x-2">
    <select 
      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
      onChange={(e) => onChange(e.target.value)}
      defaultValue="30d"
    >
      <option value="7d">Last 7 Days</option>
      <option value="30d">Last 30 Days</option>
      <option value="90d">Last 90 Days</option>
      <option value="1y">Last Year</option>
      <option value="all">All Time</option>
    </select>
  </div>
);

export default DateRangeFilter;
