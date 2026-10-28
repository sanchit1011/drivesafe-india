import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Car, CheckCircle, XCircle } from 'lucide-react';
import { Card, Badge, EmptyState, Spinner, StarRating } from '../../components/ui/index';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['All', 'PENDING_VERIFICATION', 'DOCUMENTS_SUBMITTED', 'VERIFIED', 'SUSPENDED', 'REJECTED'];

const DRIVER_STATUS_BADGE: Record<string, { variant: any; label: string }> = {
  PENDING_VERIFICATION: { variant: 'yellow', label: 'Pending' },
  DOCUMENTS_SUBMITTED: { variant: 'blue', label: 'Docs Submitted' },
  VERIFIED: { variant: 'green', label: 'Verified' },
  SUSPENDED: { variant: 'red', label: 'Suspended' },
  REJECTED: { variant: 'red', label: 'Rejected' },
};

export default function AdminDriversPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-drivers', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/drivers?${params}`);
      return data.data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ driverId, status }: { driverId: string; status: string }) => {
      await api.patch(`/admin/drivers/${driverId}/verify`, { status });
    },
    onSuccess: (_, { status }) => {
      toast.success(`Driver ${status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Action failed'),
  });

  const drivers = data?.items || [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
        <p className="text-gray-500 text-sm">{data?.total || 0} total drivers</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {s === 'All' ? 'All' : DRIVER_STATUS_BADGE[s]?.label || s}
          </button>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-9"
              placeholder="Search drivers..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : drivers.length === 0 ? (
          <EmptyState icon={<Car size={40} />} title="No drivers found" />
        ) : (
          <div className="space-y-4">
            {drivers.map((driver: any) => {
              const statusInfo = DRIVER_STATUS_BADGE[driver.status] || { variant: 'gray', label: driver.status };
              return (
                <div key={driver.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                        {driver.user?.profile?.fullName?.[0] || 'D'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{driver.user?.profile?.fullName || '—'}</p>
                        <p className="text-sm text-gray-500">{driver.user?.phone}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarRating rating={driver.rating} size={11} />
                          <span className="text-xs text-gray-400">· {driver.totalRides} rides</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-500">
                    <div>
                      <p className="text-gray-400">License</p>
                      <p className="font-medium text-gray-700 truncate">{driver.licenseNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">License Expiry</p>
                      <p className="font-medium text-gray-700">{format(new Date(driver.licenseExpiry), 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Zone</p>
                      <p className="font-medium text-gray-700">{driver.operatingZone?.name || '—'}</p>
                    </div>
                  </div>

                  {/* Documents */}
                  {driver.documents?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {driver.documents.map((doc: any) => (
                        <span key={doc.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          doc.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {doc.type.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Admin actions */}
                  {driver.status !== 'VERIFIED' && driver.status !== 'REJECTED' && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        leftIcon={<CheckCircle size={14} />}
                        loading={verifyMutation.isPending}
                        onClick={() => verifyMutation.mutate({ driverId: driver.id, status: 'VERIFIED' })}
                      >
                        Verify
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<XCircle size={14} />}
                        onClick={() => verifyMutation.mutate({ driverId: driver.id, status: 'REJECTED' })}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                  {driver.status === 'VERIFIED' && (
                    <div className="mt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => verifyMutation.mutate({ driverId: driver.id, status: 'SUSPENDED' })}
                      >
                        Suspend
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
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
