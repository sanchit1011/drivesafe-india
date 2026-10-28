import { useQuery } from '@tanstack/react-query';
import { Users, Car, BookOpen, IndianRupee, TrendingUp } from 'lucide-react';
import { Card, BookingStatusBadge, Spinner } from '../../components/ui/index';
import api from '../../lib/api';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => { const { data } = await api.get('/admin/dashboard'); return data.data; },
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const { stats, recentBookings = [] } = data || {};

  const statCards = [
    { label: 'Total Customers', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', change: '+12.5%' },
    { label: 'Total Drivers', value: stats?.totalDrivers || 0, icon: Car, color: 'text-primary', bg: 'bg-primary-50', change: '+8.2%' },
    { label: 'Total Bookings', value: stats?.totalBookings || 0, icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50', change: '+7.1%' },
    { label: 'Active Rides', value: stats?.activeBookings || 0, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50', change: 'Live' },
    { label: 'Total Revenue', value: `₹${Math.round(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-amber-500', bg: 'bg-amber-50', change: '+10.8%' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">DriveSafe India — Operations Overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg, change }) => (
          <Card key={label}>
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            <p className={`text-xs mt-1 font-medium ${change.startsWith('+') ? 'text-green-500' : 'text-blue-500'}`}>{change}</p>
          </Card>
        ))}
      </div>

      {/* Recent bookings */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent Bookings</h2>
          <a href="/admin/bookings" className="text-sm text-primary hover:underline">View all</a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Booking</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Customer</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Driver</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Route</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No bookings yet</td></tr>
              ) : recentBookings.map((b: any) => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3">
                    <p className="font-medium text-gray-900">#{b.bookingNumber}</p>
                    <p className="text-xs text-gray-400">{format(new Date(b.createdAt), 'dd MMM, hh:mm a')}</p>
                  </td>
                  <td className="py-3 px-3 text-gray-700">{b.customer?.profile?.fullName || b.customer?.phone}</td>
                  <td className="py-3 px-3 text-gray-600">{b.driver?.user?.profile?.fullName || '—'}</td>
                  <td className="py-3 px-3">
                    <p className="text-gray-700 truncate max-w-40">{b.pickupAddress?.split(',')[0]}</p>
                    <p className="text-gray-400 text-xs truncate max-w-40">→ {b.dropAddress?.split(',')[0]}</p>
                  </td>
                  <td className="py-3 px-3 font-semibold text-gray-900">₹{Math.round(b.estimatedFare)}</td>
                  <td className="py-3 px-3"><BookingStatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
