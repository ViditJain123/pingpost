/**
 * Authentication Utilities
 * 
 * This module provides utilities for handling authentication throughout the application
 */

import { createContextLogger } from './errorLogger';
import apiClient from './apiClient';

// Create logger instance
const logger = createContextLogger('AuthUtils');

/**
 * Check if the user is authenticated
 * @returns {Promise<boolean>} True if authenticated
 */
export async function isAuthenticated() {
  try {
    // Try to fetch user profile as a check
    const response = await apiClient.get('/user/profile');
    return response && response.success === true;
  } catch (error) {
    if (error.status === 401) {
      logger.info('User is not authenticated');
      return false;
    }
    
    logger.error('Error checking authentication status', { error });
    // If there was a network error, assume the user might be authenticated
    // The UI should handle re-verification when connectivity is restored
    return error.code === 'NETWORK_ERROR';
  }
}

/**
 * Sign out the current user
 * @returns {Promise<boolean>} True if sign out was successful
 */
export async function signOut() {
  try {
    await apiClient.post('/signout');
    
    // Redirect to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    
    return true;
  } catch (error) {
    logger.error('Error signing out', { error });
    
    // Still redirect even if API call fails
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    
    return false;
  }
}

/**
 * Get the authenticated user's profile
 * @returns {Promise<Object|null>} The user profile or null if not authenticated
 */
export async function getUserProfile() {
  try {
    const response = await apiClient.get('/user/profile');
    return response.user || null;
  } catch (error) {
    if (error.status === 401) {
      logger.info('User is not authenticated');
      return null;
    }
    
    logger.error('Error fetching user profile', { error });
    throw error;
  }
}

/**
 * Check if the current user has completed onboarding
 * @returns {Promise<boolean>} True if onboarding is complete
 */
export async function hasCompletedOnboarding() {
  try {
    const response = await apiClient.get('/onboard/getUserData');
    return response && 
           response.body && 
           response.body.linkedinSpecs && 
           Object.keys(response.body.linkedinSpecs).length > 0;
  } catch (error) {
    if (error.status === 401) {
      logger.info('User is not authenticated');
      return false;
    }
    
    if (error.status === 404) {
      logger.info('User has not completed onboarding');
      return false;
    }
    
    logger.error('Error checking onboarding status', { error });
    throw error;
  }
}

/**
 * Create a client-side authentication guard
 * @param {Function} redirectCallback - Function to handle redirection when not authenticated
 * @returns {Function} Auth guard function to use in components
 */
export function createAuthGuard(redirectCallback = () => {}) {
  return async function authGuard() {
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      logger.info('Auth guard: User not authenticated, redirecting');
      redirectCallback('/');
      return false;
    }
    
    return true;
  };
}

/**
 * Parse the authentication token from a cookie string
 * @param {string} cookieString - The cookie string
 * @returns {string|null} The token or null
 */
export function parseAuthToken(cookieString) {
  if (!cookieString) return null;
  
  const match = cookieString.match(/authToken=([^;]+)/);
  return match ? match[1] : null;
}

const authUtils = {
  isAuthenticated,
  signOut,
  getUserProfile,
  hasCompletedOnboarding,
  createAuthGuard,
  parseAuthToken
};

export default authUtils;