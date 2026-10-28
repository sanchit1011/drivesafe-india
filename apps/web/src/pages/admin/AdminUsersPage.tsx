import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { Card, Badge, EmptyState, Spinner } from '../../components/ui/index';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import { format } from 'date-fns';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20', role: 'CUSTOMER' });
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/users?${params}`);
      return data.data;
    },
  });

  const users = data?.items || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm">{data?.total || 0} total customers</p>
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-9"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : users.length === 0 ? (
          <EmptyState icon={<Users size={40} />} title="No customers found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Name', 'Phone', 'Email', 'Joined', 'Status'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-900">{u.profile?.fullName || '—'}</td>
                    <td className="py-3 px-3 text-gray-600">{u.phone}</td>
                    <td className="py-3 px-3 text-gray-500">{u.email || '—'}</td>
                    <td className="py-3 px-3 text-gray-500">{format(new Date(u.createdAt), 'dd MMM yyyy')}</td>
                    <td className="py-3 px-3">
                      <Badge variant={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
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
