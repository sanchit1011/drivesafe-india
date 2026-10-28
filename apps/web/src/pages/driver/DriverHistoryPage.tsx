import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Car, ChevronRight } from 'lucide-react';
import { Card, BookingStatusBadge, EmptyState, Spinner } from '../../components/ui/index';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import { format } from 'date-fns';

export default function DriverHistoryPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['driver-ride-history'],
    queryFn: async () => {
      const { data } = await api.get('/driver/bookings?limit=20');
      return data.data;
    },
  });

  const bookings = data?.items || [];

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ride History</h1>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<Car size={48} />}
          title="No rides yet"
          description="Your completed rides will appear here"
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking: any) => (
            <div
              key={booking.id}
              className="card hover:shadow-card-hover cursor-pointer"
              onClick={() => ['DRIVER_ASSIGNED','DRIVER_EN_ROUTE','DRIVER_ARRIVED','TRIP_STARTED'].includes(booking.status)
                ? navigate(`/driver/ride/${booking.id}`) : undefined}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-gray-400">#{booking.bookingNumber}</span>
                    <BookingStatusBadge status={booking.status} />
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{booking.dropAddress}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{format(new Date(booking.scheduledAt), 'dd MMM, hh:mm a')}</span>
                    {booking.distanceKm && <span>{booking.distanceKm.toFixed(1)} km</span>}
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className="font-bold text-green-600">
                    ₹{Math.round((booking.estimatedFare || 0) * 0.8)}
                  </p>
                  <p className="text-xs text-gray-400">Your share</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
