import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ChevronRight, Car, Star, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { BookingStatusBadge, Card, Spinner } from '../../components/ui/index';
import api from '../../lib/api';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const { data } = await api.get('/bookings?limit=5');
      return data.data;
    },
  });

  const recentBookings = bookingsData?.items || [];
  const activeBooking = recentBookings.find((b: any) =>
    ['DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_STARTED', 'SEARCHING_DRIVER'].includes(b.status)
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const name = user?.profile?.fullName?.split(' ')[0] || 'there';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-gray-500 text-sm">{greeting} 👋</p>
        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
      </div>

      {/* Active ride banner */}
      {activeBooking && (
        <div
          className="mb-6 bg-primary rounded-2xl p-5 text-white cursor-pointer"
          onClick={() => navigate(`/dashboard/ride/${activeBooking.id}`)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs font-medium mb-1">Active Ride</p>
              <p className="font-bold text-base">#{activeBooking.bookingNumber}</p>
              <div className="flex items-center gap-2 mt-2">
                <BookingStatusBadge status={activeBooking.status} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Car size={20} className="text-white/70" />
              <ChevronRight size={18} className="text-white/70" />
            </div>
          </div>
        </div>
      )}

      {/* Book ride CTA */}
      <Card className="mb-6 bg-gradient-to-br from-dark-navy to-dark-charcoal text-white border-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold mb-1">Book a Driver</h2>
            <p className="text-white/60 text-sm mb-4">Professional drivers for your car</p>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary-600"
              onClick={() => navigate('/dashboard/book')}
            >
              Book Now
            </Button>
          </div>
          <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
            <Car size={28} className="text-primary" />
          </div>
        </div>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: MapPin, label: 'Book Ride', action: () => navigate('/dashboard/book') },
          { icon: Clock, label: 'My Rides', action: () => navigate('/dashboard/history') },
          { icon: Shield, label: 'Safety', action: () => {} },
        ].map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            className="card flex flex-col items-center gap-2 py-4 hover:shadow-card-hover transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Icon size={18} className="text-primary" />
            </div>
            <span className="text-xs font-medium text-gray-700">{label}</span>
          </button>
        ))}
      </div>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent Rides</h2>
          <button
            onClick={() => navigate('/dashboard/history')}
            className="text-sm text-primary font-medium hover:underline"
          >
            View All
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : recentBookings.length === 0 ? (
          <Card className="text-center py-10">
            <Car size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No rides yet</p>
            <p className="text-gray-400 text-sm mt-1">Book your first safe ride today</p>
            <Button size="sm" className="mt-4" onClick={() => navigate('/dashboard/book')}>
              Book a Driver
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentBookings.slice(0, 3).map((booking: any) => (
              <div
                key={booking.id}
                className="card hover:shadow-card-hover cursor-pointer transition-shadow"
                onClick={() => navigate(`/dashboard/booking/${booking.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-400">#{booking.bookingNumber}</span>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <div className="flex items-start gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 truncate">{booking.pickupAddress}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 truncate">{booking.dropAddress}</p>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <p className="font-semibold text-gray-900">₹{Math.round(booking.estimatedFare)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(booking.scheduledAt), 'dd MMM')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
