import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.moltenpancake.club';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const loadUserFromToken = async (tokenToUse) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${tokenToUse}` }
      });

      setUser(res.data);
    } catch (err) {
      console.error("Failed to load user from token:", err);
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUserFromToken(token);
    }
  }, [token]);

  const login = async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login/json`, {
      email,
      password
    });
    const { access_token } = response.data;

    localStorage.setItem('token', access_token);
    setToken(access_token);

    await loadUserFromToken(access_token);

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
        await loadUserFromToken(storedToken);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const contextValue = useMemo(() => ({
    user,
    token,
    setToken,
    login,
    register,
    logout,
    isAuthenticated: !!token
  }), [user, token, setToken, login, register, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};