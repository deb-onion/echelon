import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the auth context
const AuthContext = createContext();

// Hook for child components to get the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps your app and provides the auth context
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [user, setUser] = useState(null);

  // Check if the user is already authenticated on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        // In a real app, you would check session/token validity with your API
        // const response = await api.get('/auth/status');
        // setIsAuthenticated(response.data.authenticated);
        // setUser(response.data.user);
        
        // For demo, we'll simulate authentication
        setTimeout(() => {
          // Auto-authenticate for demo purposes
          setIsAuthenticated(true);
          setUser({
            id: 'user123',
            name: 'Demo User',
            email: 'demo@example.com',
            role: 'admin'
          });
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // In a real app, you would call your API to login
      // const response = await api.post('/auth/login', { email, password });
      // setIsAuthenticated(true);
      // setUser(response.data.user);
      
      // For demo, we'll simulate successful login
      setIsAuthenticated(true);
      setUser({
        id: 'user123',
        name: 'Demo User',
        email: email,
        role: 'admin'
      });
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return { success: false, error: 'Invalid credentials' };
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would call your API to logout
      // await api.post('/auth/logout');
      
      // For demo, we'll simulate logout
      setIsAuthenticated(false);
      setUser(null);
      setAccount(null);
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
      return { success: false, error: 'Logout failed' };
    }
  };

  // Select account function
  const selectAccount = (accountId) => {
    setAccount(accountId);
  };

  // Value object that will be passed to consumers
  const value = {
    isAuthenticated,
    isLoading,
    user,
    account,
    login,
    logout,
    setAccount: selectAccount
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 