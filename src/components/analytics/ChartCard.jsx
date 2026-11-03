import React from 'react';

const ChartCard = ({ title, children, className = '' }) => (
  <div className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm ${className}`}>
    <h3 className="text-lg font-bold text-gray-900 mb-6">{title}</h3>
    <div className="w-full h-72">
      {children}
    </div>
  </div>
);

export default ChartCard;
