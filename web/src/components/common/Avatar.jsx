import React from 'react';

const Avatar = ({
  src,
  name = 'User',
  size = 'md',
  isOnline = false,
  className = ''
}) => {
  const sizes = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl'
  };

  const dotSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5'
  };

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const colors = [
    'bg-indigo-500 text-white',
    'bg-emerald-500 text-white',
    'bg-amber-500 text-white',
    'bg-rose-500 text-white',
    'bg-purple-500 text-white',
    'bg-sky-500 text-white',
    'bg-teal-500 text-white'
  ];

  // Pick deterministic color from name
  const colorIndex = name
    ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    : 0;

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizes[size] || sizes.md} rounded-full object-cover border border-slate-200`}
          onError={(e) => {
            // fallback to hiding image so placeholder initials show
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <div
          className={`${sizes[size] || sizes.md} ${colors[colorIndex]} rounded-full flex items-center justify-center font-bold tracking-wider select-none shadow-inner`}
        >
          {getInitials(name)}
        </div>
      )}

      {isOnline && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizes[size] || 'w-3 h-3'} bg-emerald-500 rounded-full ring-2 ring-white`}
          title="Online now"
        />
      )}
    </div>
  );
};

export default Avatar;

