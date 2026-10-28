import React from 'react';

// ─── Input ───────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({ label, error, hint, leftIcon, rightIcon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="input-label">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          className={`input-field ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${error ? 'border-red-400 focus:ring-red-400' : ''} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="input-error">{error}</p>}
      {!error && hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────

type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'primary';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  const styles: Record<BadgeVariant, string> = {
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-gray-100 text-gray-600',
    primary: 'bg-primary-100 text-primary-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-card p-5 ${hover ? 'hover:shadow-card-hover transition-shadow duration-200 cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} border-2 border-primary border-t-transparent rounded-full animate-spin ${className}`} />
  );
}

// ─── Star Rating ─────────────────────────────────────────────────────────────

export function StarRating({ rating, max = 5, size = 16 }: { rating: number; max?: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < Math.round(rating) ? '#F59E0B' : '#E5E7EB'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span className="text-sm text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-gray-300 mb-4">{icon}</div>}
      <h3 className="text-gray-700 font-semibold text-lg mb-1">{title}</h3>
      {description && <p className="text-gray-400 text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({ name, src, size = 'md' }: { name: string; src?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' };
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  
  if (src) return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />;
  
  return (
    <div className={`${sizes[size]} rounded-full bg-primary-100 text-primary font-semibold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-gray-100 my-4" />;
  return (
    <div className="flex items-center gap-3 my-4">
      <hr className="flex-1 border-gray-100" />
      <span className="text-xs text-gray-400">{label}</span>
      <hr className="flex-1 border-gray-100" />
    </div>
  );
}

// ─── Status Badge for Bookings ────────────────────────────────────────────────

export function BookingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    PENDING: { label: 'Pending', variant: 'yellow' },
    SEARCHING_DRIVER: { label: 'Finding Driver', variant: 'yellow' },
    DRIVER_ASSIGNED: { label: 'Driver Assigned', variant: 'blue' },
    DRIVER_EN_ROUTE: { label: 'On the Way', variant: 'blue' },
    DRIVER_ARRIVED: { label: 'Driver Arrived', variant: 'primary' },
    TRIP_STARTED: { label: 'On Trip', variant: 'primary' },
    TRIP_COMPLETED: { label: 'Completed', variant: 'green' },
    CANCELLED: { label: 'Cancelled', variant: 'red' },
    PAYMENT_PENDING: { label: 'Payment Pending', variant: 'yellow' },
    PAYMENT_COMPLETED: { label: 'Paid', variant: 'green' },
  };
  const info = map[status] || { label: status, variant: 'gray' as BadgeVariant };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}
