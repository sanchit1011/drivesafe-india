import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Car, MapPin, Bell, LogOut, ChevronRight, Plus } from 'lucide-react';
import { Card, Avatar, Spinner } from '../../components/ui/index';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../features/auth/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState(user?.profile?.fullName || '');

  const { data: vehicles, isLoading: vLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => { const { data } = await api.get('/user/vehicles'); return data.data; },
  });

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => { const { data } = await api.get('/user/addresses'); return data.data; },
  });

  const updateMutation = useMutation({
    mutationFn: async () => { await api.patch('/user/profile', { fullName }); },
    onSuccess: () => {
      toast.success('Profile updated!');
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      {/* Avatar & name */}
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <Avatar name={user?.profile?.fullName || 'U'} size="lg" />
          <div className="flex-1">
            {editMode ? (
              <input
                className="input-field text-sm"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                autoFocus
              />
            ) : (
              <p className="font-bold text-gray-900 text-lg">{user?.profile?.fullName || 'Add your name'}</p>
            )}
            <p className="text-gray-500 text-sm">{user?.phone}</p>
            <span className="text-xs bg-primary-100 text-primary px-2 py-0.5 rounded-full font-medium mt-1 inline-block capitalize">
              {user?.role?.toLowerCase()}
            </span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {editMode ? (
            <>
              <Button size="sm" loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>Save</Button>
              <Button size="sm" variant="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setEditMode(true)}>Edit Profile</Button>
          )}
        </div>
      </Card>

      {/* Vehicles */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">My Vehicles</h2>
          <button className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            <Plus size={14} /> Add
          </button>
        </div>
        {vLoading ? <Spinner className="mx-auto" /> : vehicles?.length === 0 ? (
          <Card className="text-center py-6 text-gray-400 text-sm">
            No vehicles added yet
          </Card>
        ) : (
          <div className="space-y-2">
            {vehicles?.map((v: any) => (
              <Card key={v.id} className="py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Car size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{v.make} {v.model} ({v.year})</p>
                    <p className="text-xs text-gray-400">{v.licensePlate} · {v.color}</p>
                  </div>
                  {v.isDefault && (
                    <span className="ml-auto text-xs bg-primary-100 text-primary px-2 py-0.5 rounded-full">Default</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Saved Addresses */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Saved Addresses</h2>
          <button className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            <Plus size={14} /> Add
          </button>
        </div>
        {addresses?.length === 0 ? (
          <Card className="text-center py-6 text-gray-400 text-sm">No addresses saved</Card>
        ) : (
          <div className="space-y-2">
            {addresses?.map((a: any) => (
              <Card key={a.id} className="py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
                    <MapPin size={16} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{a.label}</p>
                    <p className="text-xs text-gray-400 truncate max-w-xs">{a.address}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Menu items */}
      <Card className="mb-4">
        {[
          { icon: Bell, label: 'Notifications', action: () => {} },
          { icon: User, label: 'Privacy & Consent', action: () => {} },
        ].map(({ icon: Icon, label, action }) => (
          <button key={label} onClick={action} className="flex items-center gap-3 w-full py-3 first:pt-0 last:pb-0 border-b last:border-0 border-gray-50 hover:bg-gray-50 -mx-5 px-5">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <Icon size={16} className="text-gray-400" />
            </div>
            <span className="text-sm text-gray-700 flex-1 text-left">{label}</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        ))}
      </Card>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 w-full p-4 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
      >
        <LogOut size={18} />
        <span className="font-medium">Sign Out</span>
      </button>
    </div>
  );
}
