import { FareEstimate } from '@drivesafe/shared';

interface FareParams {
  distanceKm: number;
  durationMinutes: number;
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
  nightSurcharge: number;
  waitingCharge: number;
  returnCharge: number;
  gstPercent: number;
  scheduledAt: Date;
  isOutstation?: boolean;
  outstationRate?: number;
}

export function calculateFare(params: FareParams): FareEstimate {
  const {
    distanceKm,
    durationMinutes,
    baseFare,
    perKmRate,
    perMinuteRate,
    minimumFare,
    nightSurcharge,
    waitingCharge,
    returnCharge,
    gstPercent,
    scheduledAt,
  } = params;

  const hour = scheduledAt.getHours();
  const isNight = hour >= 22 || hour < 6;
  
  const distanceCharge = distanceKm * perKmRate;
  const timeCharge = durationMinutes * perMinuteRate;
  const nightCharge = isNight ? nightSurcharge : 0;

  let subtotal = baseFare + distanceCharge + timeCharge + nightCharge;
  subtotal = Math.max(subtotal, minimumFare);

  const gstAmount = Math.round((subtotal * gstPercent) / 100);
  const totalAmount = subtotal + gstAmount;

  return {
    baseFare,
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMinutes: Math.round(durationMinutes),
    perKmCharge: Math.round(distanceCharge),
    perMinuteCharge: Math.round(timeCharge),
    nightSurcharge: Math.round(nightCharge),
    waitingCharge: 0,
    returnCharge: Math.round(returnCharge),
    subtotal: Math.round(subtotal),
    gstAmount,
    totalAmount: Math.round(totalAmount),
    returnPolicy: 'SEPARATE_CHARGE',
  };
}

export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function estimateDuration(distanceKm: number): number {
  // Estimate 3 min/km in city traffic + 5 min base
  return Math.max(10, Math.round(distanceKm * 3 + 5));
}
