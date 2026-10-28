export type UserRole = 'CUSTOMER' | 'DRIVER' | 'ADMIN';
export type DriverStatus = 'PENDING_VERIFICATION' | 'DOCUMENTS_SUBMITTED' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED';
export type DriverAvailability = 'ONLINE' | 'OFFLINE' | 'ON_TRIP';
export type BookingStatus = 
  | 'PENDING' 
  | 'SEARCHING_DRIVER' 
  | 'DRIVER_ASSIGNED' 
  | 'DRIVER_EN_ROUTE' 
  | 'DRIVER_ARRIVED' 
  | 'TRIP_STARTED' 
  | 'TRIP_COMPLETED' 
  | 'CANCELLED' 
  | 'PAYMENT_PENDING' 
  | 'PAYMENT_COMPLETED';
export type PaymentStatus = 'PENDING' | 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'CASH' | 'RAZORPAY';
export type ReturnPolicy = 'INCLUDED' | 'SEPARATE_CHARGE' | 'DRIVER_ARRANGES' | 'OUTSTATION_RULES';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email?: string;
  avatarUrl?: string;
  phone: string;
  role: UserRole;
}

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  rating: number;
  totalRides: number;
  avatarUrl?: string;
  currentLat?: number;
  currentLng?: number;
  availability: DriverAvailability;
  status: DriverStatus;
}

export interface BookingSummary {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  pickupAddress: string;
  dropAddress: string;
  scheduledAt: string;
  estimatedFare: number;
  finalFare?: number;
  driver?: DriverInfo;
}

export interface FareEstimate {
  baseFare: number;
  distanceKm: number;
  durationMinutes: number;
  perKmCharge: number;
  perMinuteCharge: number;
  nightSurcharge: number;
  waitingCharge: number;
  returnCharge: number;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  returnPolicy: ReturnPolicy;
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  placeId?: string;
}
