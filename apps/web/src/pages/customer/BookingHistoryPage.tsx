import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Car, ChevronRight } from 'lucide-react';
import { Card, BookingStatusBadge, EmptyState, Spinner } from '../../components/ui/index';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import { format } from 'date-fns';

const STATUS_FILTERS = ['All', 'Active', 'Completed', 'Cancelled'];

export default function BookingHistoryPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', filter, page],
    queryFn: async () => {
      const { data } = await api.get(`/bookings?page=${page}&limit=10`);
      return data.data;
    },
  });

  const filterBooking = (booking: any) => {
    if (filter === 'All') return true;
    if (filter === 'Active') return ['PENDING','SEARCHING_DRIVER','DRIVER_ASSIGNED','DRIVER_EN_ROUTE','DRIVER_ARRIVED','TRIP_STARTED'].includes(booking.status);
    if (filter === 'Completed') return ['TRIP_COMPLETED','PAYMENT_PENDING','PAYMENT_COMPLETED'].includes(booking.status);
    if (filter === 'Cancelled') return booking.status === 'CANCELLED';
    return true;
  };

  const bookings = (data?.items || []).filter(filterBooking);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Rides</h1>
        <p className="text-gray-500 text-sm mt-1">All your booking history</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<Car size={48} />}
          title="No rides found"
          description="Your ride history will appear here"
          action={<Button size="sm" onClick={() => navigate('/dashboard/book')}>Book a Ride</Button>}
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking: any) => (
            <div
              key={booking.id}
              className="card hover:shadow-card-hover cursor-pointer transition-shadow"
              onClick={() => {
                const isActive = ['DRIVER_ASSIGNED','DRIVER_EN_ROUTE','DRIVER_ARRIVED','TRIP_STARTED'].includes(booking.status);
                navigate(isActive ? `/dashboard/ride/${booking.id}` : `/dashboard/booking/${booking.id}`);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-400 font-medium">#{booking.bookingNumber}</span>
                    <BookingStatusBadge status={booking.status} />
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {booking.pickupAddress}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    → {booking.dropAddress}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{format(new Date(booking.scheduledAt), 'dd MMM yyyy, hh:mm a')}</span>
                    {booking.distanceKm && <span>{booking.distanceKm.toFixed(1)} km</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{Math.round(booking.finalFare || booking.estimatedFare)}
                    </p>
                    {booking.payment?.status === 'SUCCESS' && (
                      <p className="text-xs text-green-500">Paid</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex justify-center gap-3 pt-4">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-gray-500 py-2">Page {page} of {data.totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
