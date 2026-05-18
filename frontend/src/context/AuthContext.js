// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_BASE_URL = 'http://localhost:8000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email,
      password
    });
    const { access_token } = response.data;
    
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser({ email });
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await axios.post(`${API_BASE_URL}/register`, {
      name,
      email,
      password
    });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    setLoading(false);
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