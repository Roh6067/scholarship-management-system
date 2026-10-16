import axios from 'axios'
export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api', withCredentials: true, headers: { 'Content-Type': 'application/json' } })
export const authApi = { register: (data: unknown) => api.post('/auth/register', data), login: (data: unknown) => api.post('/auth/login', data), logout: () => api.post('/auth/logout'), me: () => api.get('/auth/me') }
export const scholarshipApi = { list: (params?: Record<string, string>) => api.get('/scholarships', { params }), get: (id: string) => api.get(`/scholarships/${id}`) }
export const applicationApi = { list: () => api.get('/applications'), create: (scholarship: string) => api.post('/applications', { scholarship }), submit: (id: string) => api.patch(`/applications/${id}/submit`) }
