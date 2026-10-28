import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin, Clock, Car, ChevronRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Card, BookingStatusBadge, Spinner } from '../../components/ui/index';
import api from '../../lib/api';
import { format } from 'date-fns';

export default function BookingConfirmPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data } = await api.get(`/bookings/${bookingId}`);
      return data.data;
    },
    refetchInterval: 5000, // poll every 5s for driver assignment
    enabled: !!bookingId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-3" />
          <p className="text-gray-500">Loading booking...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isSearching = ['PENDING', 'SEARCHING_DRIVER'].includes(data.status);
  const hasDriver = !!data.driver;

  return (
    <div className="p-6 max-w-lg mx-auto">
      {/* Status header */}
      <div className="text-center mb-8">
        {isSearching ? (
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <Loader2 size={32} className="text-primary animate-spin" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {isSearching ? 'Finding your driver…' : 'Booking Confirmed!'}
        </h1>
        <p className="text-gray-500 text-sm">
          {isSearching
            ? 'We are matching you with the nearest available driver'
            : 'Your driver has been assigned'}
        </p>
      </div>

      {/* Booking reference */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 font-medium">Booking ID</p>
            <p className="font-bold text-gray-900 text-lg">#{data.bookingNumber}</p>
          </div>
          <BookingStatusBadge status={data.status} />
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Pickup</p>
              <p className="text-sm font-medium text-gray-800">{data.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Destination</p>
              <p className="text-sm font-medium text-gray-800">{data.dropAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock size={14} className="text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Scheduled At</p>
              <p className="text-sm font-medium text-gray-800">
                {format(new Date(data.scheduledAt), 'dd MMM yyyy, hh:mm a')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">Estimated Fare</span>
          <span className="text-xl font-bold text-gray-900">₹{Math.round(data.estimatedFare)}</span>
        </div>
      </Card>

      {/* Driver card */}
      {hasDriver && (
        <Card className="mb-4 border-2 border-primary-100">
          <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wide">Driver Assigned</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary font-bold text-lg">
              {data.driver.user.profile?.fullName?.[0] || 'D'}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{data.driver.user.profile?.fullName}</p>
              <p className="text-sm text-gray-500">{data.driver.user.phone}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-yellow-400 text-xs">★</span>
                <span className="text-xs text-gray-500">{data.driver.rating} · {data.driver.totalRides} rides</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* OTP */}
      {data.otp && !['TRIP_STARTED', 'TRIP_COMPLETED', 'PAYMENT_COMPLETED', 'CANCELLED'].includes(data.status) && (
        <Card className="mb-4 bg-amber-50 border border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-1">Trip Start OTP</p>
          <p className="text-3xl font-bold text-amber-800 tracking-widest">{data.otp}</p>
          <p className="text-xs text-amber-600 mt-1">Share this with your driver when they arrive to start the trip</p>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {['DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'TRIP_STARTED'].includes(data.status) && (
          <Button fullWidth size="lg" rightIcon={<ChevronRight size={18} />}
            onClick={() => navigate(`/dashboard/ride/${data.id}`)}>
            Track Ride
          </Button>
        )}
        <Button variant="secondary" fullWidth onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
