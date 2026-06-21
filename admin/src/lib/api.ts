import { getToken, clearToken } from './auth';
import type {
  Room,
  HotelService,
  HotelContent,
  ServiceRequest,
} from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const HOTEL_ID = process.env.NEXT_PUBLIC_HOTEL_ID ?? '';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string> ?? {}) },
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as T;
}

export const api = {
  /* ── Auth ── */
  login: (email: string, password: string) =>
    req<{ token: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /* ── Rooms ── */
  getRooms: () => req<Room[]>('/admin/rooms'),
  getRoom:  (id: string) => req<Room>(`/admin/rooms/${id}`),
  setRoomBackground: (id: string, backgroundUrl: string) =>
    req<Room>(`/admin/rooms/${id}/background`, {
      method: 'PUT',
      body: JSON.stringify({ backgroundUrl }),
    }),

  /* ── Push ── */
  pushAnnouncement: (roomId: string, message: string, duration = 15) =>
    req<{ ok: boolean }>(`/admin/push/${roomId}`, {
      method: 'POST',
      body: JSON.stringify({ message, duration }),
    }),
  pushRefresh: (roomId: string) =>
    req<{ ok: boolean }>(`/admin/push/${roomId}`, {
      method: 'POST',
      body: JSON.stringify({ message: '', type: 'REFRESH_CONFIG' }),
    }),
  rebootDevice: (roomId: string) =>
    req<{ ok: boolean }>(`/admin/push-reboot/${roomId}`, { method: 'POST' }),

  /* ── Services ── */
  getServices: () => req<HotelService[]>(`/admin/services?hotel_id=${HOTEL_ID}`),
  createService: (data: Partial<HotelService>) =>
    req<HotelService>('/admin/services', {
      method: 'POST',
      body: JSON.stringify({ ...data, hotelId: HOTEL_ID }),
    }),
  updateService: (id: string, data: Partial<HotelService>) =>
    req<HotelService>(`/admin/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteService: (id: string) =>
    req<{ ok: boolean }>(`/admin/services/${id}`, { method: 'DELETE' }),

  /* ── Content ── */
  getContent: () => req<HotelContent[]>(`/admin/content?hotel_id=${HOTEL_ID}`),
  createContent: (data: Partial<HotelContent>) =>
    req<HotelContent>('/admin/content', {
      method: 'POST',
      body: JSON.stringify({ ...data, hotelId: HOTEL_ID }),
    }),
  updateContent: (id: string, data: Partial<HotelContent>) =>
    req<HotelContent>(`/admin/content/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /* ── Devices ── */
  getDevices: () => req<Room[]>('/admin/devices'),

  /* ── Service requests (alarm / reception / taxi) ── */
  getRequests: (status?: string) =>
    req<{ data: ServiceRequest[] }>(
      `/admin/requests${status ? `?status=${status}` : ''}`,
    ).then((r) => r.data),
  updateRequest: (id: string, status: string) =>
    req<{ data: ServiceRequest }>(`/admin/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }).then((r) => r.data),

  /* ── Media ── */
  presignUpload: (filename: string, contentType: string) =>
    req<{ uploadUrl: string; publicUrl: string }>('/admin/media/presign', {
      method: 'POST',
      body: JSON.stringify({ filename, contentType }),
    }),

  uploadFile: async (file: File): Promise<string> => {
    const { uploadUrl, publicUrl } = await api.presignUpload(file.name, file.type);
    await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    return publicUrl;
  },
};
