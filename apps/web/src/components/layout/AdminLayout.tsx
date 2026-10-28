import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Car, BookOpen, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Customers' },
  { to: '/admin/drivers', icon: Car, label: 'Drivers' },
  { to: '/admin/bookings', icon: BookOpen, label: 'Bookings' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col fixed h-full z-30">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-dark-charcoal flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900">DriveSafe</span>
              <p className="text-xs text-gray-400">Admin Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 px-3 mb-2">{user?.profile?.fullName} · Admin</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900">Admin Dashboard</span>
          <div className="flex gap-2">
            {navItems.map(({ to, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) =>
                `p-2 rounded-lg ${isActive ? 'bg-gray-900 text-white' : 'text-gray-500'}`
              }>
                <Icon size={18} />
              </NavLink>
            ))}
            <button onClick={handleLogout} className="p-2 text-red-500"><LogOut size={18} /></button>
          </div>
        </div>
      </div>

      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
