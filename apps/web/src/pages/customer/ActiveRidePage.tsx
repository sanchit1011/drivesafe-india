import { useParams, useNavigate } from 'react-router-dom';
import { Phone, MessageCircle, MapPin, Clock, ChevronRight, CheckCircle, Car } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, BookingStatusBadge, StarRating, Spinner } from '../../components/ui/index';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_STEPS = [
  { key: 'DRIVER_ASSIGNED', label: 'Driver Assigned', icon: Car },
  { key: 'DRIVER_EN_ROUTE', label: 'On the Way', icon: MapPin },
  { key: 'DRIVER_ARRIVED', label: 'Arrived', icon: CheckCircle },
  { key: 'TRIP_STARTED', label: 'Trip Started', icon: ChevronRight },
  { key: 'TRIP_COMPLETED', label: 'Completed', icon: CheckCircle },
];

export default function ActiveRidePage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data } = await api.get(`/bookings/${bookingId}`);
      return data.data;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (['TRIP_COMPLETED', 'PAYMENT_COMPLETED', 'CANCELLED'].includes(status)) return false;
      return 5000;
    },
    enabled: !!bookingId,
  });

  const ratingMutation = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment?: string }) => {
      await api.post('/bookings/reviews', { bookingId, rating, comment });
    },
    onSuccess: () => {
      toast.success('Thanks for your rating!');
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      // Create order
      const { data: orderData } = await api.post('/payments/orders', { bookingId });
      const { orderId, isMock } = orderData.data;

      // In dev/mock mode, verify immediately
      if (isMock) {
        await api.post('/payments/verify', { bookingId, orderId, isMock: true });
      }
    },
    onSuccess: () => {
      toast.success('Payment successful!');
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
    onError: () => toast.error('Payment failed. Try again.'),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/bookings/${bookingId}/cancel`, { reason: 'Customer cancelled' });
    },
    onSuccess: () => {
      toast.success('Booking cancelled');
      navigate('/dashboard');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!booking) return null;

  const statusIndex = STATUS_STEPS.findIndex(s => s.key === booking.status);
  const isCompleted = booking.status === 'TRIP_COMPLETED' || booking.status === 'PAYMENT_COMPLETED' || booking.status === 'PAYMENT_PENDING';
  const isPaid = booking.status === 'PAYMENT_COMPLETED';
  const canCancel = ['PENDING', 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE'].includes(booking.status);

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Your Ride</h1>
          <p className="text-gray-400 text-sm">#{booking.bookingNumber}</p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      {/* Map placeholder */}
      <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl h-48 flex items-center justify-center mb-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #e5e7eb 0, #e5e7eb 1px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, #e5e7eb 0, #e5e7eb 1px, transparent 0, transparent 50%)',
            backgroundSize: '30px 30px',
          }} />
        </div>
        <div className="relative text-center">
          <MapPin size={32} className="text-primary mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600">
            {booking.driver ? 'Driver Location Updating' : 'Waiting for driver'}
          </p>
          {booking.driver?.currentLat && (
            <p className="text-xs text-gray-400 mt-1">
              {booking.driver.currentLat.toFixed(4)}, {booking.driver.currentLng?.toFixed(4)}
            </p>
          )}
        </div>
      </div>

      {/* Progress steps */}
      <Card className="mb-4">
        <div className="relative">
          {STATUS_STEPS.map((step, i) => {
            const isDone = i <= statusIndex;
            const isCurrent = i === statusIndex;
            return (
              <div key={step.key} className="flex items-center gap-3 py-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                  ${isDone ? 'bg-primary' : 'bg-gray-100'}`}>
                  {isDone ? (
                    <CheckCircle size={14} className="text-white" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </div>
                <span className={`text-sm font-medium ${isCurrent ? 'text-primary' : isDone ? 'text-gray-700' : 'text-gray-300'}`}>
                  {step.label}
                </span>
                {isCurrent && (
                  <span className="ml-auto text-xs bg-primary-100 text-primary px-2 py-0.5 rounded-full font-medium">Current</span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Driver info */}
      {booking.driver && (
        <Card className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary font-bold text-lg">
              {booking.driver.user.profile?.fullName?.[0] || 'D'}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{booking.driver.user.profile?.fullName}</p>
              <div className="flex items-center gap-1">
                <span className="text-xs text-yellow-500">★</span>
                <span className="text-xs text-gray-500">{booking.driver.rating}</span>
                <span className="text-gray-300 text-xs">·</span>
                <span className="text-xs text-gray-500">{booking.driver.totalRides} rides</span>
              </div>
            </div>
            <a href={`tel:${booking.driver.user.phone}`} className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Phone size={18} className="text-green-600" />
            </a>
          </div>

          {/* OTP display */}
          {booking.otp && !booking.otpVerified && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl">
              <p className="text-xs font-medium text-amber-700 mb-1">Share this OTP to start trip</p>
              <p className="text-2xl font-bold text-amber-800 tracking-widest">{booking.otp}</p>
            </div>
          )}
        </Card>
      )}

      {/* Trip summary (completed) */}
      {isCompleted && (
        <Card className="mb-4">
          <h3 className="font-bold text-gray-900 mb-3">Trip Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Distance</span><span>{booking.distanceKm?.toFixed(1)} km</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Duration</span><span>~{booking.durationMinutes} min</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
              <span>Total</span>
              <span className="text-primary">₹{Math.round(booking.finalFare || booking.estimatedFare)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {/* Payment button */}
        {booking.status === 'PAYMENT_PENDING' && !isPaid && (
          <Button fullWidth size="lg" loading={payMutation.isPending} onClick={() => payMutation.mutate()}>
            Pay ₹{Math.round(booking.estimatedFare)}
          </Button>
        )}

        {/* Rating (after completed) */}
        {(booking.status === 'PAYMENT_COMPLETED' || booking.status === 'TRIP_COMPLETED') && !booking.reviews?.length && (
          <Card className="text-center">
            <p className="font-semibold text-gray-900 mb-1">Rate your driver</p>
            <p className="text-sm text-gray-400 mb-3">How was your experience?</p>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => ratingMutation.mutate({ rating: star })}
                  className="text-3xl hover:scale-110 transition-transform"
                >
                  ⭐
                </button>
              ))}
            </div>
          </Card>
        )}

        {isPaid && booking.reviews?.length > 0 && (
          <Button variant="secondary" fullWidth onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        )}

        {canCancel && (
          <Button variant="ghost" fullWidth loading={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate()}
            className="text-red-500 hover:bg-red-50">
            Cancel Booking
          </Button>
        )}
      </div>
    </div>
  );
}
