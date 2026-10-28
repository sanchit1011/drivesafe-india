import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, History, User, Bell, LogOut, MapPin, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { Avatar } from '../ui';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/dashboard/book', icon: MapPin, label: 'Book Ride' },
  { to: '/dashboard/history', icon: History, label: 'My Rides' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
];

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col fixed h-full z-30">
        <div className="p-5 border-b border-gray-100">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Car size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">DriveSafe</span>
          </NavLink>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <Avatar name={user?.profile?.fullName || user?.phone || 'U'} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.profile?.fullName || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.phone}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Car size={15} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">DriveSafe</span>
        </NavLink>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-500">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <nav className="absolute top-14 left-0 right-0 bg-white shadow-lg p-4 space-y-1">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-primary-50 text-primary' : 'text-gray-600'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-3 w-full text-left text-red-500 text-sm font-medium">
              <LogOut size={18} />
              Sign out
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
