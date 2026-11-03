import React from 'react';

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => (
        <div key={i} className="bg-gray-200 h-32 rounded-2xl"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1,2].map(i => (
        <div key={i} className="bg-gray-200 h-80 rounded-2xl"></div>
      ))}
    </div>
  </div>
);

export default LoadingSkeleton;
