import React from 'react';

export default function LoadingSpinner({ 
  size = 'medium', 
  text = 'Loading...', 
  fullScreen = false,
  className = '' 
}) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xl: 'text-xl'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} rounded-full border-4 border-gray-200`}></div>
        {/* Spinning ring */}
        <div className={`${sizeClasses[size]} rounded-full border-4 border-transparent border-t-primary-600 border-r-primary-600 animate-spin absolute top-0 left-0`}></div>
      </div>
      {text && (
        <p className={`mt-3 text-gray-600 font-medium ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}

export function ContentLoading({ text = 'Loading...', className = '' }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <LoadingSpinner text={text} />
    </div>
  );
}

function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-card p-6 border border-gray-100 animate-pulse ${className}`}>
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};