import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Clock, Car, User } from 'lucide-react';
import { Card, BookingStatusBadge, Spinner, StarRating } from '../../components/ui/index';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import { format } from 'date-fns';

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data } = await api.get(`/bookings/${bookingId}`);
      return data.data;
    },
    enabled: !!bookingId,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!booking) return null;

  const isActive = ['DRIVER_ASSIGNED','DRIVER_EN_ROUTE','DRIVER_ARRIVED','TRIP_STARTED'].includes(booking.status);

  return (
    <div className="p-6 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-5">
        <ArrowLeft size={18} />
        <span className="text-sm">Back</span>
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ride #{booking.bookingNumber}</h1>
          <p className="text-sm text-gray-400">{format(new Date(booking.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      {/* Route */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Route</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Pickup</p>
              <p className="text-sm font-medium text-gray-800">{booking.pickupAddress}</p>
            </div>
          </div>
          <div className="ml-3.5 border-l-2 border-dashed border-gray-200 h-4" />
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Destination</p>
              <p className="text-sm font-medium text-gray-800">{booking.dropAddress}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Trip details */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400">Scheduled</p>
            <p className="font-medium">{format(new Date(booking.scheduledAt), 'dd MMM, hh:mm a')}</p>
          </div>
          {booking.distanceKm && (
            <div>
              <p className="text-xs text-gray-400">Distance</p>
              <p className="font-medium">{booking.distanceKm.toFixed(1)} km</p>
            </div>
          )}
          {booking.durationMinutes && (
            <div>
              <p className="text-xs text-gray-400">Duration</p>
              <p className="font-medium">~{booking.durationMinutes} min</p>
            </div>
          )}
        </div>
      </Card>

      {/* Driver */}
      {booking.driver && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Driver</h3>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary font-bold">
              {booking.driver.user.profile?.fullName?.[0] || 'D'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{booking.driver.user.profile?.fullName}</p>
              <p className="text-sm text-gray-400">{booking.driver.user.phone}</p>
              <StarRating rating={booking.driver.rating} size={12} />
            </div>
          </div>
        </Card>
      )}

      {/* Fare */}
      <Card className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Fare</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Estimated fare</span><span>₹{Math.round(booking.estimatedFare)}</span>
          </div>
          {booking.gstAmount && (
            <div className="flex justify-between text-gray-600">
              <span>GST included</span><span>₹{Math.round(booking.gstAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2">
            <span>Total</span>
            <span className="text-primary">₹{Math.round(booking.finalFare || booking.estimatedFare)}</span>
          </div>
        </div>
        {booking.payment && (
          <div className="mt-3 text-xs text-gray-400">
            Payment: <span className={booking.payment.status === 'SUCCESS' ? 'text-green-600 font-medium' : 'text-gray-500'}>
              {booking.payment.status}
            </span>
          </div>
        )}
      </Card>

      {isActive && (
        <Button fullWidth size="lg" onClick={() => navigate(`/dashboard/ride/${booking.id}`)}>
          Track This Ride
        </Button>
      )}
    </div>
  );
}
