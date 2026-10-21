import { mockRequest } from './mock-api';

export async function apiRequest(path, options = {}) {
  return mockRequest(path, options);
}
