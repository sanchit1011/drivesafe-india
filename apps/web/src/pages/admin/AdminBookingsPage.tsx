import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, BookOpen } from 'lucide-react';
import { Card, BookingStatusBadge, EmptyState, Spinner } from '../../components/ui/index';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminBookingsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [assigning, setAssigning] = useState<{ bookingId: string; driverId: string } | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/bookings?${params}`);
      return data.data;
    },
    refetchInterval: 15000,
  });

  const { data: driversData } = useQuery({
    queryKey: ['admin-drivers-list'],
    queryFn: async () => {
      const { data } = await api.get('/admin/drivers?status=VERIFIED&limit=50');
      return data.data;
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ bookingId, driverId }: { bookingId: string; driverId: string }) => {
      await api.post(`/admin/bookings/${bookingId}/assign`, { driverId });
    },
    onSuccess: () => {
      toast.success('Driver assigned!');
      setAssigning(null);
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Assignment failed'),
  });

  const bookings = data?.items || [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500 text-sm">{data?.total || 0} total bookings</p>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-9"
              placeholder="Search by booking number..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : bookings.length === 0 ? (
          <EmptyState icon={<BookOpen size={40} />} title="No bookings found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Booking', 'Customer', 'Driver', 'Route', 'Fare', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b: any) => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <p className="font-medium text-gray-900">#{b.bookingNumber}</p>
                      <p className="text-xs text-gray-400">{format(new Date(b.createdAt), 'dd MMM, hh:mm a')}</p>
                    </td>
                    <td className="py-3 px-3 text-gray-700">{b.customer?.profile?.fullName || b.customer?.phone || '—'}</td>
                    <td className="py-3 px-3 text-gray-600">
                      {b.driver?.user?.profile?.fullName || (
                        <span className="text-gray-300 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-gray-700 text-xs truncate max-w-32">{b.pickupAddress?.split(',')[0]}</p>
                      <p className="text-gray-400 text-xs truncate max-w-32">→ {b.dropAddress?.split(',')[0]}</p>
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-900">₹{Math.round(b.estimatedFare)}</td>
                    <td className="py-3 px-3"><BookingStatusBadge status={b.status} /></td>
                    <td className="py-3 px-3">
                      {['PENDING','SEARCHING_DRIVER'].includes(b.status) && !b.driverId && (
                        assigning?.bookingId === b.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              className="input-field py-1 text-xs"
                              value={assigning.driverId}
                              onChange={e => setAssigning({ bookingId: b.id, driverId: e.target.value })}
                            >
                              <option value="">Select driver</option>
                              {driversData?.items?.map((d: any) => (
                                <option key={d.id} value={d.id}>
                                  {d.user?.profile?.fullName} ({d.availability})
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              disabled={!assigning.driverId}
                              loading={assignMutation.isPending}
                              onClick={() => assigning.driverId && assignMutation.mutate({ bookingId: b.id, driverId: assigning.driverId })}
                            >
                              Assign
                            </Button>
                            <button onClick={() => setAssigning(null)} className="text-gray-400 hover:text-gray-600 text-xs">Cancel</button>
                          </div>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => setAssigning({ bookingId: b.id, driverId: '' })}>
                            Assign Driver
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data?.totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {data.totalPages}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
