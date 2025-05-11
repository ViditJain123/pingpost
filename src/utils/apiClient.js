import axios from 'axios';
import { createContextLogger } from './errorLogger';

// Create a logger instance for API client
const logger = createContextLogger('ApiClient');

// Default configuration
const DEFAULT_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
};

// Create base axios instance
const apiClient = axios.create(DEFAULT_CONFIG);

// Custom error class for API errors
export class ApiError extends Error {
  constructor(message, status, code, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'API_ERROR';
    this.data = data;
    this.isOperational = true; // Mark as operational error for error handling
  }
}

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    const url = new URL(config.url, window.location.origin);
    if (config.method === 'get') {
      url.searchParams.append('_t', Date.now());
      config.url = url.pathname + url.search;
    }
    
    // You can add auth token here if needed
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    return config;
  },
  (error) => {
    logger.error('Request interceptor error', { error: error.message });
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Get original request config
    const originalRequest = error.config;
    
    // If network error or timeout
    if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
      logger.warn('Network error or timeout', { 
        url: originalRequest.url,
        method: originalRequest.method 
      });
      
      throw new ApiError(
        'Network error: Please check your connection',
        0,
        'NETWORK_ERROR'
      );
    }
    
    // If error response exists
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle unauthorized errors (401)
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        // Could implement token refresh here if needed
        // Try to refresh token and retry request
        
        // For now, redirect to login
        if (typeof window !== 'undefined') {
          logger.info('Authentication required, redirecting to login');
          window.location.href = '/?session=expired';
          return Promise.reject(
            new ApiError('Authentication required', status, 'AUTH_REQUIRED')
          );
        }
      }
      
      // Prepare error message
      const message = 
        (data && data.error) ||
        (data && data.message) ||
        'An unexpected error occurred';
      
      // Log the error
      logger.error('API response error', {
        status,
        url: originalRequest.url,
        method: originalRequest.method,
        message
      });
      
      // Throw custom error
      throw new ApiError(
        message,
        status,
        (data && data.code) || `HTTP_${status}`,
        data
      );
    }
    
    // For any other errors
    logger.error('Unexpected API error', { error: error.message });
    throw new ApiError(
      error.message || 'An unexpected error occurred',
      0,
      'UNKNOWN_ERROR'
    );
  }
);

/**
 * Make a GET request
 * @param {string} url - The URL to request
 * @param {Object} params - Query parameters
 * @param {Object} config - Additional axios config
 * @returns {Promise<any>} Response data
 */
export const get = async (url, params = {}, config = {}) => {
  try {
    const response = await apiClient.get(url, {
      params,
      ...config,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Failed to fetch data',
      error.response?.status || 0,
      'GET_REQUEST_FAILED'
    );
  }
};

/**
 * Make a POST request
 * @param {string} url - The URL to request
 * @param {Object} data - Request payload
 * @param {Object} config - Additional axios config
 * @returns {Promise<any>} Response data
 */
export const post = async (url, data = {}, config = {}) => {
  try {
    const response = await apiClient.post(url, data, config);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Failed to submit data',
      error.response?.status || 0,
      'POST_REQUEST_FAILED'
    );
  }
};

/**
 * Make a PUT request
 * @param {string} url - The URL to request
 * @param {Object} data - Request payload
 * @param {Object} config - Additional axios config
 * @returns {Promise<any>} Response data
 */
export const put = async (url, data = {}, config = {}) => {
  try {
    const response = await apiClient.put(url, data, config);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Failed to update data',
      error.response?.status || 0,
      'PUT_REQUEST_FAILED'
    );
  }
};

/**
 * Make a DELETE request
 * @param {string} url - The URL to request
 * @param {Object} config - Additional axios config
 * @returns {Promise<any>} Response data
 */
export const del = async (url, config = {}) => {
  try {
    const response = await apiClient.delete(url, config);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Failed to delete data',
      error.response?.status || 0,
      'DELETE_REQUEST_FAILED'
    );
  }
};

// Create API service object first, then export it
const apiService = {
  get,
  post,
  put,
  delete: del,
  client: apiClient,
  ApiError,
};

export default apiService;