import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_BASE_URL = 'http://localhost:8000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const fetchUserInfo = useCallback(async (authToken) => {
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, { headers });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (!user) {
        fetchUserInfo();
      }
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token, user, fetchUserInfo]);

  const login = async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login/json`, {
      email,
      password
    });
    const { access_token } = response.data;
    
    localStorage.setItem('token', access_token);
    setToken(access_token);
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    
    await fetchUserInfo(access_token);
    
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      email,
      password,
      full_name: name
    });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      register, 
      logout, 
      isAuthenticated: !!token 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};