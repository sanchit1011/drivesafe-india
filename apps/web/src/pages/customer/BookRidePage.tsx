import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Calendar, Clock, ChevronRight, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Card, Spinner } from '../../components/ui/index';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format, addHours } from 'date-fns';

const schema = z.object({
  pickupAddress: z.string().min(3, 'Enter pickup address'),
  dropAddress: z.string().min(3, 'Enter destination'),
  scheduledDate: z.string().min(1, 'Select date'),
  scheduledTime: z.string().min(1, 'Select time'),
});

type FormData = z.infer<typeof schema>;

// Mock coordinates for demo (in real app, use Google Places Autocomplete)
const mockGeocode = (address: string) => {
  const base = { lat: 12.9352, lng: 77.6245 };
  const hash = address.length;
  return { lat: base.lat + (hash % 10) * 0.01, lng: base.lng + (hash % 7) * 0.01 };
};

export default function BookRidePage() {
  const navigate = useNavigate();
  const [fareEstimate, setFareEstimate] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const defaultDate = format(addHours(new Date(), 1), 'yyyy-MM-dd');
  const defaultTime = format(addHours(new Date(), 1), 'HH:mm');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { scheduledDate: defaultDate, scheduledTime: defaultTime },
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => { const { data } = await api.get('/user/vehicles'); return data.data; },
  });

  const estimateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const pickup = mockGeocode(formData.pickupAddress);
      const drop = mockGeocode(formData.dropAddress);
      const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();
      const { data } = await api.post('/bookings/estimate', {
        pickupLat: pickup.lat, pickupLng: pickup.lng,
        dropLat: drop.lat, dropLng: drop.lng,
        scheduledAt,
      });
      return data.data;
    },
    onSuccess: (data) => {
      setFareEstimate(data);
      setShowConfirm(true);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to estimate fare'),
  });

  const bookMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const pickup = mockGeocode(formData.pickupAddress);
      const drop = mockGeocode(formData.dropAddress);
      const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();
      const vehicle = vehiclesData?.[0];
      const { data } = await api.post('/bookings', {
        pickupAddress: formData.pickupAddress,
        pickupLat: pickup.lat, pickupLng: pickup.lng,
        dropAddress: formData.dropAddress,
        dropLat: drop.lat, dropLng: drop.lng,
        scheduledAt,
        vehicleId: vehicle?.id,
      });
      return data.data;
    },
    onSuccess: (data) => {
      toast.success('Booking confirmed!');
      navigate(`/dashboard/confirm/${data.id}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Booking failed'),
  });

  const formValues = watch();

  const onSubmit = handleSubmit((data) => {
    if (!showConfirm) estimateMutation.mutate(data);
    else bookMutation.mutate(data);
  });

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Book a Driver</h1>
        <p className="text-gray-500 text-sm mt-1">A professional driver will drive your own car</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Pickup & Drop */}
        <Card>
          <div className="space-y-4">
            {/* Pickup */}
            <div>
              <label className="input-label flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                Pickup Location
              </label>
              <input
                className={`input-field ${errors.pickupAddress ? 'border-red-400' : ''}`}
                placeholder="Enter pickup address"
                {...register('pickupAddress')}
              />
              {errors.pickupAddress && <p className="input-error">{errors.pickupAddress.message}</p>}
            </div>

            <div className="border-l-2 border-dashed border-gray-200 ml-1.5 pl-4 py-1">
              <MapPin size={14} className="text-gray-300" />
            </div>

            {/* Drop */}
            <div>
              <label className="input-label flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                Destination
              </label>
              <input
                className={`input-field ${errors.dropAddress ? 'border-red-400' : ''}`}
                placeholder="Enter destination"
                {...register('dropAddress')}
              />
              {errors.dropAddress && <p className="input-error">{errors.dropAddress.message}</p>}
            </div>
          </div>
        </Card>

        {/* Date & Time */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Schedule</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-400" /> Date
              </label>
              <input type="date" className="input-field" {...register('scheduledDate')} />
              {errors.scheduledDate && <p className="input-error">{errors.scheduledDate.message}</p>}
            </div>
            <div>
              <label className="input-label flex items-center gap-1.5">
                <Clock size={13} className="text-gray-400" /> Time
              </label>
              <input type="time" className="input-field" {...register('scheduledTime')} />
              {errors.scheduledTime && <p className="input-error">{errors.scheduledTime.message}</p>}
            </div>
          </div>
        </Card>

        {/* Vehicle */}
        {vehiclesData?.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Vehicle</h3>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Navigation size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {vehiclesData[0].make} {vehiclesData[0].model} ({vehiclesData[0].year})
                </p>
                <p className="text-xs text-gray-400">{vehiclesData[0].licensePlate} · {vehiclesData[0].color}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Fare Estimate */}
        {fareEstimate && showConfirm && (
          <Card className="border-2 border-primary-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Fare Estimate</h3>
              <span className="text-2xl font-bold text-primary">₹{fareEstimate.totalAmount}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Base fare</span><span>₹{fareEstimate.baseFare}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Distance ({fareEstimate.distanceKm} km)</span>
                <span>₹{fareEstimate.perKmCharge}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Duration (~{fareEstimate.durationMinutes} min)</span>
                <span>₹{fareEstimate.perMinuteCharge}</span>
              </div>
              {fareEstimate.nightSurcharge > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Night surcharge</span><span>₹{fareEstimate.nightSurcharge}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex justify-between text-gray-600">
                <span>GST (5%)</span><span>₹{fareEstimate.gstAmount}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span><span>₹{fareEstimate.totalAmount}</span>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 text-xs text-gray-400">
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              <span>Final fare may vary based on actual distance and waiting time. Return travel not included.</span>
            </div>
          </Card>
        )}

        {/* Submit */}
        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={estimateMutation.isPending || bookMutation.isPending}
          rightIcon={<ChevronRight size={18} />}
        >
          {showConfirm ? 'Confirm & Book Driver' : 'Get Fare Estimate'}
        </Button>

        {showConfirm && (
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
          >
            Edit booking details
          </button>
        )}
      </form>
    </div>
  );
}
