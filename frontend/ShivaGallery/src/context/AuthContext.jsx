// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Create the Auth Context
export const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Initial loading for auth state
  const [authError, setAuthError] = useState(null);

  const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Base URL for your Django backend API

  // Function to save tokens to localStorage
  const saveTokens = (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  };

  // Function to clear tokens from localStorage
  const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  // Function to refresh access token
  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      setIsAuthenticated(false);
      setUser(null);
      clearTokens();
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      const data = await response.json();

      if (response.ok) {
        saveTokens(data.access, refreshToken); // Save new access token, keep refresh token
        setIsAuthenticated(true);
        return data.access;
      } else {
        console.error('Token refresh failed:', data);
        clearTokens();
        setIsAuthenticated(false);
        setUser(null);
        setAuthError(data.detail || 'نشست شما منقضی شده است. لطفاً دوباره وارد شوید.');
        return null;
      }
    } catch (error) {
      console.error('Network error during token refresh:', error);
      clearTokens();
      setIsAuthenticated(false);
      setUser(null);
      setAuthError('خطای شبکه در هنگام رفرش توکن. لطفاً اتصال خود را بررسی کنید.');
      return null;
    }
  }, [API_BASE_URL]);

  // Function to perform authenticated fetch requests
  // Added requiresAuth parameter
  const authenticatedFetch = useCallback(async (url, options = {}, requiresAuth = true) => {
    let accessToken = localStorage.getItem('accessToken');
    let headers = { ...options.headers };

    if (requiresAuth) {
      // If no access token, try to refresh
      if (!accessToken) {
        accessToken = await refreshAccessToken();
        if (!accessToken) {
          // If refresh also fails, throw an error to signal unauthenticated state
          throw new Error('No valid access token available. Please log in again.');
        }
      }
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers: headers,
      });

      // If token expired (401 Unauthorized) AND requiresAuth is true, try refreshing and re-requesting
      if (response.status === 401 && requiresAuth) {
        accessToken = await refreshAccessToken();
        if (accessToken) {
          // Retry the request with the new token
          response = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${accessToken}`,
            },
          });
        } else {
          // If refresh failed, re-throw the 401 error
          throw new Error('Authentication failed after token refresh.');
        }
      }

      return response;
    } catch (error) {
      console.error('Authenticated fetch error:', error);
      setAuthError(error.message || 'خطا در درخواست احراز هویت.');
      throw error;
    }
  }, [refreshAccessToken]);

  // Function to fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      // Profile endpoint requires authentication
      const response = await authenticatedFetch(`${API_BASE_URL}/profile/`, {}, true); // Explicitly require auth
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setIsAuthenticated(true);
      } else if (response.status === 404) {
        console.warn('User profile not found for authenticated user. Setting user to null.');
        setUser(null);
        setIsAuthenticated(true); // User is authenticated, but no profile data
      } else if (response.status === 401) {
          // If 401, it means token is invalid even after refresh or no token.
          // This case is handled by authenticatedFetch, but good to explicitly set state here too.
          setIsAuthenticated(false);
          setUser(null);
          setAuthError('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.');
      }
      else {
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error('Failed to parse JSON response for profile:', jsonError);
            data = { detail: 'پاسخ سرور قابل پردازش نیست.' };
        }
        console.error('Failed to fetch user profile:', data);
        setIsAuthenticated(false);
        setUser(null);
        setAuthError(data.detail || 'خطا در بارگذاری اطلاعات کاربر.');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setIsAuthenticated(false);
      setUser(null);
      setAuthError('خطای شبکه یا سرور در دسترس نیست.');
    } finally {
      setIsLoading(false);
    }
  }, [authenticatedFetch, API_BASE_URL]);

  // Initial authentication check and user profile fetch
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        await fetchUserProfile();
      } else {
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          await fetchUserProfile();
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
        }
      }
    };
    checkAuth();
  }, [fetchUserProfile, refreshAccessToken]);

  // Login function
  const login = async (username, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (response.ok) {
        saveTokens(data.access, data.refresh);
        await fetchUserProfile();
        return { success: true };
      } else {
        console.error('Login failed:', data);
        const errors = Object.values(data).flat().join(' ');
        setAuthError(errors || 'نام کاربری یا رمز عبور اشتباه است.');
        return { success: false, error: errors };
      }
    } catch (error) {
      console.error('Network error during login:', error);
      setAuthError('خطای شبکه یا سرور در دسترس نیست.');
      return { success: false, error: 'خطای شبکه' };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      const data = await response.json();

      if (response.ok) {
        const loginResult = await login(userData.username, userData.password);
        return loginResult;
      } else {
        console.error('Registration failed:', data);
        const errors = Object.values(data).flat().join(' ');
        setAuthError(errors || 'خطا در ثبت نام.');
        return { success: false, error: errors };
      }
    } catch (error) {
      console.error('Network error during registration:', error);
      setAuthError('خطای شبکه یا سرور در دسترس نیست.');
      return { success: false, error: 'خطای شبکه' };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = useCallback(() => {
    clearTokens();
    setIsAuthenticated(false);
    setUser(null);
    setAuthError(null);
  }, []);

  const authContextValue = {
    isAuthenticated,
    user,
    isLoading,
    authError,
    login,
    register,
    logout,
    authenticatedFetch,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use Auth Context
export const useAuth = () => {
  return useContext(AuthContext);
};
