import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Clock, ChevronRight, IndianRupee, Star, Car, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, BookingStatusBadge, Spinner } from '../../components/ui/index';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../features/auth/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: async () => { const { data } = await api.get('/driver/profile'); return data.data; },
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['driver-bookings', 'active'],
    queryFn: async () => {
      const { data } = await api.get('/driver/bookings?limit=5');
      return data.data;
    },
    refetchInterval: 8000,
  });

  const toggleMutation = useMutation({
    mutationFn: async (availability: 'ONLINE' | 'OFFLINE') => {
      await api.patch('/driver/availability', { availability });
    },
    onSuccess: (_, availability) => {
      toast.success(availability === 'ONLINE' ? 'You are now online' : 'You are now offline');
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to update status'),
  });

  const acceptMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await api.post(`/driver/bookings/${bookingId}/accept`);
    },
    onSuccess: (_, bookingId) => {
      toast.success('Booking accepted!');
      queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
      navigate(`/driver/ride/${bookingId}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to accept booking'),
  });

  if (profileLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const isOnline = profile?.availability === 'ONLINE';
  const isOnTrip = profile?.availability === 'ON_TRIP';
  const recentBookings = bookingsData?.items || [];
  const pendingRequests = recentBookings.filter((b: any) =>
    ['SEARCHING_DRIVER', 'PENDING'].includes(b.status) && !b.driverId
  );
  const activeRide = recentBookings.find((b: any) =>
    ['DRIVER_ASSIGNED','DRIVER_EN_ROUTE','DRIVER_ARRIVED','TRIP_STARTED'].includes(b.status)
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-white/60 text-sm">Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}</p>
        <h1 className="text-2xl font-bold text-white">{user?.profile?.fullName?.split(' ')[0] || 'Driver'}</h1>
      </div>

      {/* Online toggle */}
      <Card className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900">
              {isOnTrip ? 'On Trip' : isOnline ? 'You\'re Online' : 'You\'re Offline'}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">
              {isOnTrip ? 'Complete your current ride' : isOnline ? 'Ready to accept bookings' : 'Go online to start earning'}
            </p>
          </div>
          {!isOnTrip && (
            <button
              onClick={() => toggleMutation.mutate(isOnline ? 'OFFLINE' : 'ONLINE')}
              disabled={toggleMutation.isPending}
              className="transition-opacity disabled:opacity-50"
            >
              {isOnline
                ? <ToggleRight size={48} className="text-primary" />
                : <ToggleLeft size={48} className="text-gray-300" />}
            </button>
          )}
        </div>
      </Card>

      {/* Driver stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Rating', value: profile?.rating?.toFixed(1) || '—', icon: Star, color: 'text-yellow-500' },
          { label: 'Total Rides', value: profile?.totalRides || 0, icon: Car, color: 'text-primary' },
          { label: 'Earnings', value: `₹${Math.round(profile?.totalEarnings || 0)}`, icon: IndianRupee, color: 'text-green-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="text-center py-3 px-2">
            <Icon size={20} className={`${color} mx-auto mb-1`} />
            <p className="text-lg font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </Card>
        ))}
      </div>

      {/* Active ride */}
      {activeRide && (
        <div className="mb-5">
          <h2 className="font-semibold text-white mb-3">Active Ride</h2>
          <div
            className="bg-primary rounded-2xl p-4 cursor-pointer"
            onClick={() => navigate(`/driver/ride/${activeRide.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="text-white">
                <BookingStatusBadge status={activeRide.status} />
                <p className="font-bold mt-2">#{activeRide.bookingNumber}</p>
                <p className="text-sm text-white/70 truncate mt-1">{activeRide.dropAddress}</p>
              </div>
              <ChevronRight size={20} className="text-white/70" />
            </div>
          </div>
        </div>
      )}

      {/* New booking requests */}
      {isOnline && pendingRequests.length > 0 && (
        <div className="mb-5">
          <h2 className="font-semibold text-white mb-3">New Requests</h2>
          {pendingRequests.map((booking: any) => (
            <Card key={booking.id} className="mb-3 border-2 border-primary-100">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{booking.pickupAddress}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">→ {booking.dropAddress}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{booking.distanceKm?.toFixed(1)} km</span>
                    <span>{format(new Date(booking.scheduledAt), 'hh:mm a')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-lg">₹{Math.round(booking.estimatedFare)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  fullWidth
                  loading={acceptMutation.isPending}
                  onClick={() => acceptMutation.mutate(booking.id)}
                >
                  Accept
                </Button>
                <Button variant="secondary" fullWidth onClick={() => {}}>
                  Decline
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Recent activity */}
      <div>
        <h2 className="font-semibold text-white mb-3">Recent Rides</h2>
        {bookingsLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : recentBookings.filter((b: any) => ['TRIP_COMPLETED','PAYMENT_COMPLETED'].includes(b.status)).length === 0 ? (
          <Card className="text-center py-8">
            <Car size={32} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No completed rides yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentBookings
              .filter((b: any) => ['TRIP_COMPLETED','PAYMENT_COMPLETED'].includes(b.status))
              .slice(0, 3)
              .map((booking: any) => (
                <Card key={booking.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">#{booking.bookingNumber}</p>
                      <p className="text-xs text-gray-400 truncate max-w-48">{booking.dropAddress}</p>
                      <p className="text-xs text-gray-300 mt-0.5">
                        {format(new Date(booking.scheduledAt), 'dd MMM, hh:mm a')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹{Math.round((booking.estimatedFare || 0) * 0.8)}</p>
                      <p className="text-xs text-gray-400">Your share</p>
                    </div>
                  </div>
                </Card>
              ))}
            <button
              onClick={() => navigate('/driver/history')}
              className="text-sm text-primary font-medium hover:underline w-full text-center py-2"
            >
              View all rides →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
