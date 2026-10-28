import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, IndianRupee, History, LogOut, Car } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/driver', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/driver/earnings', icon: IndianRupee, label: 'Earnings' },
  { to: '/driver/history', icon: History, label: 'Ride History' },
];

export default function DriverLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:flex w-64 bg-dark-navy text-white flex-col fixed h-full z-30">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Car size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-base">DriveSafe</span>
              <p className="text-xs text-white/50">Driver Portal</p>
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
                  isActive ? 'bg-primary text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-white/40 px-3 mb-2">{user?.profile?.fullName}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-navy border-t border-white/10 flex">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-white/50'
              }`
            }
          >
            <Icon size={20} />
            <span className="mt-1">{label}</span>
          </NavLink>
        ))}
      </div>

      <main className="flex-1 lg:ml-64 pb-16 lg:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
