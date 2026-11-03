import React from 'react';

export default function ProgressBar({ current = 0, target = 100, label = '', showPercentage = true, color = 'bg-secondary' }) {
  const percentage = Math.min(Math.round((current / (target || 1)) * 100), 100);

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium mb-1.5">
          <span>{label}</span>
          {showPercentage && <span className="font-semibold text-primary">{percentage}%</span>}
        </div>
      )}
      <div className="w-full bg-surface-container-high rounded-full h-2.5 overflow-hidden">
        <div
          className={`${color} h-2.5 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
