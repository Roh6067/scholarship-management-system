import axios from 'axios'

export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api', withCredentials: true, headers: { 'Content-Type': 'application/json' } })
export const authApi = { register: (data: unknown) => api.post('/auth/register', data), login: (data: unknown) => api.post('/auth/login', data), logout: () => api.post('/auth/logout'), me: () => api.get('/auth/me') }
export const profileApi = { get: () => api.get('/profile'), update: (data: unknown) => api.put('/profile', data) }
export const scholarshipApi = { list: (params?: Record<string, string>) => api.get('/scholarships', { params }), get: (id: string) => api.get(`/scholarships/${id}`), create: (data: unknown) => api.post('/scholarships', data), update: (id: string, data: unknown) => api.patch(`/scholarships/${id}`, data) }
export const applicationApi = { list: () => api.get('/applications'), create: (scholarship: string) => api.post('/applications', { scholarship }), update: (id: string, data: unknown) => api.patch(`/applications/${id}`, data), submit: (id: string) => api.patch(`/applications/${id}/submit`), updateStatus: (id: string, status: string, remarks?: string) => api.patch(`/applications/${id}/status`, { status, remarks }) }
export const notificationApi = { list: () => api.get('/notifications'), markRead: (id: string) => api.patch(`/notifications/${id}/read`) }
export const dashboardApi = { stats: () => api.get('/dashboard/stats') }
api.interceptors.response.use((response) => response, (error) => { if (error.response?.status === 401 && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:expired')); return Promise.reject(error) })
