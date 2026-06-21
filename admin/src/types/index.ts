export interface Hotel {
  id: string;
  name: string;
  city: string;
  countryCode: string;
  timezone: string;
  defaultLanguage: string;
  logoUrl?: string;
}

export interface RoomGuest {
  id: string;
  roomId: string;
  exelyReservationId: string;
  guestFirstName: string;
  guestLastName: string;
  guestLanguage: string;
  checkIn: string;
  checkOut: string;
}

export interface Room {
  id: string;
  hotelId: string;
  roomNumber: string;
  floor?: number;
  deviceToken: string;
  deviceType: 'android_tv' | 'tizen';
  backgroundUrl?: string;
  lastSeenAt?: string;
  online?: boolean;
  guests: RoomGuest[];
}

export interface HotelService {
  id: string;
  hotelId: string;
  label: Record<string, string> | string;
  iconUrl?: string;
  sortOrder: number;
  available: boolean;
  deepLink?: string;
  createdAt?: string;
}

export interface HotelContent {
  id: string;
  hotelId: string;
  contentType: 'background' | 'announcement' | 'menu_item' | 'promo';
  title?: Record<string, string> | string;
  body?: Record<string, string> | string;
  mediaUrl?: string;
  active: boolean;
  displayFrom?: string;
  displayUntil?: string;
  priority?: string;
  createdAt: string;
}

export interface Device extends Room {
  online: boolean;
}

export type ServiceRequestType = 'ALARM' | 'RECEPTION' | 'TAXI';
export type ServiceRequestStatus =
  | 'PENDING'
  | 'ACKNOWLEDGED'
  | 'RESOLVED'
  | 'CANCELLED';

export interface ServiceRequest {
  id: string;
  type: ServiceRequestType | string;
  status: ServiceRequestStatus | string;
  roomNumber: string;
  guestName: string;
  note: string;
  source: string;
  hotelName: string;
  hotelSlug: string;
  createdAt: string;
  updatedAt: string;
}

export function getLabel(label: Record<string, string> | string | undefined, lang = 'en'): string {
  if (!label) return '';
  if (typeof label === 'string') return label;
  return label[lang] ?? label.en ?? Object.values(label)[0] ?? '';
}

export function isOnline(lastSeenAt?: string): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 5 * 60_000;
}
