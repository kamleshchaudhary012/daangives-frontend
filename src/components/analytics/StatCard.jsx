import React from 'react';

const StatCard = ({ title, value, icon, subtitle }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      {icon && <span className="material-symbols-outlined text-primary text-xl">{icon}</span>}
    </div>
    <div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
    </div>
  </div>
);

export default StatCard;
