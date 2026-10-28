import { useQuery } from '@tanstack/react-query';
import { IndianRupee, TrendingUp, Car, Star } from 'lucide-react';
import { Card, Spinner } from '../../components/ui/index';
import api from '../../lib/api';

export default function DriverEarningsPage() {
  const { data: earnings, isLoading } = useQuery({
    queryKey: ['driver-earnings'],
    queryFn: async () => { const { data } = await api.get('/driver/earnings'); return data.data; },
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const stats = [
    { label: "Today", value: `₹${Math.round(earnings?.today || 0)}`, icon: IndianRupee, color: 'text-green-500', bg: 'bg-green-50' },
    { label: "This Week", value: `₹${Math.round(earnings?.week || 0)}`, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: "This Month", value: `₹${Math.round(earnings?.month || 0)}`, icon: IndianRupee, color: 'text-primary', bg: 'bg-primary-50' },
    { label: "Total", value: `₹${Math.round(earnings?.total || 0)}`, icon: IndianRupee, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Earnings</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="text-center">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="text-center">
          <Car size={20} className="text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{earnings?.totalRides || 0}</p>
          <p className="text-xs text-gray-400">Total Rides</p>
        </Card>
        <Card className="text-center">
          <Star size={20} className="text-yellow-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{earnings?.rating?.toFixed(1) || '—'}</p>
          <p className="text-xs text-gray-400">Avg Rating</p>
        </Card>
      </div>

      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Recent Earnings</h2>
        {!earnings?.recent?.length ? (
          <Card className="text-center py-8 text-gray-400 text-sm">No earnings yet</Card>
        ) : (
          <div className="space-y-2">
            {earnings.recent.map((e: any) => (
              <Card key={e.id} className="py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Ride completed</p>
                    <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <p className="font-bold text-green-600">+₹{Math.round(e.amount)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
