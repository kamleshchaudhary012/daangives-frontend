import React from 'react';

const EmptyChartState = ({ message = "Not enough data to display chart" }) => (
  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
    <span className="material-symbols-outlined text-4xl mb-3 opacity-50">bar_chart</span>
    <p className="text-sm font-medium">{message}</p>
  </div>
);

export default EmptyChartState;
