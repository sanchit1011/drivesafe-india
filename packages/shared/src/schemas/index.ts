import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^(\+91)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number');

export const loginSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  idToken: z.string().min(1, 'Firebase ID token required'),
});

export const bookingCreateSchema = z.object({
  pickupAddress: z.string().min(3),
  pickupLat: z.number(),
  pickupLng: z.number(),
  pickupPlaceId: z.string().optional(),
  dropAddress: z.string().min(3),
  dropLat: z.number(),
  dropLng: z.number(),
  dropPlaceId: z.string().optional(),
  scheduledAt: z.string().datetime(),
  vehicleId: z.string().optional(),
  specialNotes: z.string().max(500).optional(),
});

export const fareEstimateSchema = z.object({
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropLat: z.number(),
  dropLng: z.number(),
  scheduledAt: z.string().datetime(),
  zoneId: z.string().optional(),
});

export const reviewCreateSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
});

export const vehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  color: z.string().min(1),
  licensePlate: z.string().min(4).max(15),
  isDefault: z.boolean().optional(),
});

export const savedAddressSchema = z.object({
  label: z.string().min(1).max(50),
  address: z.string().min(5),
  lat: z.number(),
  lng: z.number(),
  placeId: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const driverStatusUpdateSchema = z.object({
  availability: z.enum(['ONLINE', 'OFFLINE', 'ON_TRIP']),
});

export const locationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
