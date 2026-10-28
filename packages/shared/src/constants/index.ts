export const SOCKET_EVENTS = {
  // Booking events
  BOOKING_STATUS_UPDATE: 'booking:status_update',
  BOOKING_DRIVER_ASSIGNED: 'booking:driver_assigned',
  BOOKING_CANCELLED: 'booking:cancelled',

  // Driver events
  DRIVER_LOCATION_UPDATE: 'driver:location_update',
  DRIVER_AVAILABILITY_CHANGE: 'driver:availability_change',
  NEW_BOOKING_REQUEST: 'driver:new_booking_request',
  BOOKING_REQUEST_EXPIRED: 'driver:booking_request_expired',

  // Trip events
  TRIP_STARTED: 'trip:started',
  TRIP_COMPLETED: 'trip:completed',

  // General
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  JOIN_BOOKING_ROOM: 'join:booking_room',
  LEAVE_BOOKING_ROOM: 'leave:booking_room',
} as const;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  SEARCHING_DRIVER: 'Finding Driver',
  DRIVER_ASSIGNED: 'Driver Assigned',
  DRIVER_EN_ROUTE: 'Driver on the Way',
  DRIVER_ARRIVED: 'Driver Arrived',
  TRIP_STARTED: 'On Trip',
  TRIP_COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  PAYMENT_PENDING: 'Payment Pending',
  PAYMENT_COMPLETED: 'Payment Done',
};

export const INDIAN_PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/;

export const OTP_LENGTH = 6;

export const MAX_BOOKING_SEARCH_RADIUS_KM = 15;

export const DRIVER_REQUEST_TIMEOUT_SECONDS = 30;

export const DEV_OTP = '123456';

export const CURRENCY = 'INR';

export const CURRENCY_SYMBOL = '₹';

export const SUPPORT_PHONE = '+918000001234';
export const SUPPORT_EMAIL = 'support@drivesafe.in';
