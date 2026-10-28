import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Phone, CheckCircle, ChevronRight } from 'lucide-react';
import { Card, BookingStatusBadge, Spinner } from '../../components/ui/index';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const NEXT_STATUS: Record<string, { label: string; next: string; requiresOtp?: boolean }> = {
  DRIVER_ASSIGNED: { label: 'I\'m on the way', next: 'DRIVER_EN_ROUTE' },
  DRIVER_EN_ROUTE: { label: 'I\'ve Arrived', next: 'DRIVER_ARRIVED' },
  DRIVER_ARRIVED: { label: 'Start Trip (Enter OTP)', next: 'TRIP_STARTED', requiresOtp: true },
  TRIP_STARTED: { label: 'Complete Trip', next: 'TRIP_COMPLETED' },
};

export default function DriverRidePage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [otp, setOtp] = useState('');

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data } = await api.get(`/bookings/${bookingId}`);
      return data.data;
    },
    refetchInterval: 5000,
    enabled: !!bookingId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ status, otp }: { status: string; otp?: string }) => {
      await api.patch(`/driver/bookings/${bookingId}/status`, { status, otp });
    },
    onSuccess: (_, vars) => {
      toast.success(`Status updated to: ${vars.status.replace(/_/g, ' ')}`);
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      if (vars.status === 'TRIP_COMPLETED') navigate('/driver');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Update failed'),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!booking) return null;

  const nextAction = NEXT_STATUS[booking.status];

  const handleAction = () => {
    if (!nextAction) return;
    if (nextAction.requiresOtp && otp.length < 6) {
      toast.error('Enter the 6-digit OTP from customer');
      return;
    }
    updateMutation.mutate({ status: nextAction.next, otp: nextAction.requiresOtp ? otp : undefined });
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Active Ride</h1>
          <p className="text-gray-400 text-sm">#{booking.bookingNumber}</p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      {/* Map placeholder */}
      <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl h-40 mb-5 flex items-center justify-center relative overflow-hidden">
        <MapPin size={32} className="text-primary" />
        <p className="text-sm text-gray-500 ml-2">Navigate to {
          booking.status === 'DRIVER_ASSIGNED' || booking.status === 'DRIVER_EN_ROUTE'
            ? 'pickup location'
            : 'destination'
        }</p>
      </div>

      {/* Customer info */}
      <Card className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase">Customer</h3>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary font-bold text-lg">
            {booking.customer.profile?.fullName?.[0] || 'C'}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{booking.customer.profile?.fullName}</p>
            <p className="text-sm text-gray-400">{booking.customer.phone}</p>
          </div>
          <a href={`tel:${booking.customer.phone}`} className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Phone size={18} className="text-green-600" />
          </a>
        </div>
      </Card>

      {/* Route */}
      <Card className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase">Route</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5" />
            <div>
              <p className="text-xs text-gray-400">Pickup</p>
              <p className="text-sm font-medium text-gray-800">{booking.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 mt-1.5" />
            <div>
              <p className="text-xs text-gray-400">Drop</p>
              <p className="text-sm font-medium text-gray-800">{booking.dropAddress}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
          <span>{booking.distanceKm?.toFixed(1)} km</span>
          <span>Fare: <strong>₹{Math.round(booking.estimatedFare)}</strong></span>
          <span>{format(new Date(booking.scheduledAt), 'hh:mm a')}</span>
        </div>
      </Card>

      {/* Vehicle */}
      {booking.vehicle && (
        <Card className="mb-4">
          <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Vehicle to Drive</h3>
          <p className="text-sm font-medium text-gray-900">
            {booking.vehicle.make} {booking.vehicle.model} ({booking.vehicle.year}) · {booking.vehicle.color}
          </p>
          <p className="text-sm text-primary font-bold mt-1">{booking.vehicle.licensePlate}</p>
        </Card>
      )}

      {/* OTP input for starting trip */}
      {booking.status === 'DRIVER_ARRIVED' && (
        <Card className="mb-4 border-2 border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-700 mb-2">Enter Customer OTP to Start Trip</p>
          <div className="flex gap-2">
            <input
              className="input-field flex-1 text-center text-xl font-bold tracking-widest"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>
        </Card>
      )}

      {/* Action button */}
      {nextAction && (
        <Button
          fullWidth
          size="lg"
          loading={updateMutation.isPending}
          onClick={handleAction}
          rightIcon={<ChevronRight size={18} />}
        >
          {nextAction.label}
        </Button>
      )}

      {booking.status === 'TRIP_COMPLETED' && (
        <div className="text-center mt-4">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
          <p className="text-lg font-bold text-gray-900">Trip Completed!</p>
          <p className="text-gray-500 text-sm mb-4">Great job! You earned ₹{Math.round((booking.estimatedFare || 0) * 0.8)}</p>
          <Button fullWidth onClick={() => navigate('/driver')}>Back to Dashboard</Button>
        </div>
      )}
    </div>
  );
}
