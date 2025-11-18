import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Services
export const servicesApi = {
  getAll: () => api.get('/services'),
  getOne: (id: string) => api.get(`/services/${id}`),
  create: (data: any) => api.post('/services', data),
  update: (id: string, data: any) => api.patch(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

// API Specs
export const apiSpecsApi = {
  getAll: (serviceId?: string) => api.get('/api-specs', { params: { serviceId } }),
  getOne: (id: string) => api.get(`/api-specs/${id}`),
  getParsed: (id: string) => api.get(`/api-specs/${id}/parsed`),
  create: (data: any) => api.post('/api-specs', data),
  delete: (id: string) => api.delete(`/api-specs/${id}`),
};

// Contract Suites
export const contractSuitesApi = {
  getAll: (serviceId?: string) => api.get('/contract-suites', { params: { serviceId } }),
  getOne: (id: string) => api.get(`/contract-suites/${id}`),
  create: (data: any) => api.post('/contract-suites', data),
  generate: (data: any) => api.post('/contract-suites/generate', data),
  update: (id: string, data: any) => api.patch(`/contract-suites/${id}`, data),
  delete: (id: string) => api.delete(`/contract-suites/${id}`),
};

// Contract Runs
export const contractRunsApi = {
  getAll: (suiteId?: string) => api.get('/contract-runs', { params: { suiteId } }),
  getOne: (id: string) => api.get(`/contract-runs/${id}`),
  execute: (suiteId: string) => api.post('/contract-runs/execute', { suiteId }),
  delete: (id: string) => api.delete(`/contract-runs/${id}`),
};
